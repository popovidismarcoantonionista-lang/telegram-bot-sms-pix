const express = require('express');
const crypto = require('crypto');
const { getOrderById, updateOrder } = require('../database/models/Order');
const { getUserByTgId } = require('../database/models/User');
const { calculateCredits } = require('../services/pricing');
const { addCredits } = require('../services/credits');
const { validateHmac } = require('../middleware/hmac');
const { checkIdempotency, saveIdempotency } = require('../middleware/idempotency');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/', validateHmac, checkIdempotency, async (req, res) => {
  try {
    const { id, status, value, external_id } = req.body;

    logger.info('PixIntegra webhook received', {
      chargeId: id,
      status: status,
      value: value,
      externalId: external_id
    });

    // Extrair order_id
    const orderId = external_id?.replace('order_', '');
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid external_id' });
    }

    // Buscar pedido
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verificar se já foi processado
    if (order.status === 'completed') {
      return res.status(200).json({ message: 'Already processed' });
    }

    // Processar pagamento confirmado
    if (status === 'paid' || status === 'confirmed') {
      // Atualizar status do pedido
      await updateOrder(orderId, {
        status: 'completed'
      });

      // Calcular e adicionar créditos
      const credits = calculateCredits(order.amount, order.tier);
      const user = await addCredits(order.user_id, credits);

      // Buscar dados do Telegram
      const tgUser = await getUserByTgId(user.tg_id);

      // Notificar usuário via Telegram
      const bot = req.app.get('bot');
      await bot.telegram.sendMessage(
        tgUser.tg_id,
        `✅ *Pagamento Confirmado!*\n\n` +
        `💰 Valor pago: R$ ${order.amount.toFixed(2)}\n` +
        `🎁 Créditos recebidos: R$ ${credits.toFixed(2)}\n` +
        `💳 Saldo atual: R$ ${user.balance.toFixed(2)}\n\n` +
        `Obrigado pela sua compra! 🎉`,
        { parse_mode: 'Markdown' }
      );

      logger.info('Payment confirmed and credits added', {
        orderId: orderId,
        userId: user.id,
        amount: order.amount,
        credits: credits,
        newBalance: user.balance
      });

      // Salvar resposta de idempotência
      await saveIdempotency(req.idempotencyKey, {
        success: true,
        orderId: orderId,
        credits: credits
      });

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully'
      });
    }

    // Outros status (pending, cancelled, etc.)
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    logger.error('Error processing PixIntegra webhook', {
      error: error.message,
      body: req.body
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
