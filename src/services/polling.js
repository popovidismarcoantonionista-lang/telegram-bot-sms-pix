const { getSmsStatus } = require('../api/smsActivate');
const { updateSmsRent } = require('../database/models/SmsRent');
const { addCredits } = require('./credits');
const logger = require('../utils/logger');

const activePolls = new Map();

/**
 * Inicia o polling de um SMS
 */
function startSmsPolling(ctx, smsRent, activationId) {
  const pollInterval = 10000; // 10 segundos
  const maxAttempts = 120; // 20 minutos (120 × 10s)
  let attempts = 0;

  const pollId = setInterval(async () => {
    try {
      attempts++;

      const status = await getSmsStatus(activationId);

      if (status.status === 'completed' && status.code) {
        // SMS recebido!
        clearInterval(pollId);
        activePolls.delete(activationId);

        await updateSmsRent(smsRent.id, {
          status: 'completed',
          sms_code: status.code
        });

        await ctx.telegram.sendMessage(
          ctx.from.id,
          `✅ *SMS Recebido!*\n\n` +
          `📱 Número: ${smsRent.phone}\n` +
          `🔐 Código: \`${status.code}\`\n\n` +
          `Use este código para verificar sua conta.`,
          { parse_mode: 'Markdown' }
        );

        logger.info('SMS code received', {
          activationId: activationId,
          code: status.code,
          userId: smsRent.user_id
        });
      } else if (status.status === 'cancelled' || attempts >= maxAttempts) {
        // Timeout ou cancelado - devolver créditos
        clearInterval(pollId);
        activePolls.delete(activationId);

        await updateSmsRent(smsRent.id, {
          status: 'expired'
        });

        // Devolver créditos
        await addCredits(smsRent.user_id, smsRent.cost);

        await ctx.telegram.sendMessage(
          ctx.from.id,
          `⏱ *SMS Expirado*\n\n` +
          `O número ${smsRent.phone} expirou sem receber código.\n\n` +
          `💰 Créditos devolvidos: R$ ${smsRent.cost.toFixed(2)}`,
          { parse_mode: 'Markdown' }
        );

        logger.info('SMS rental expired, credits refunded', {
          activationId: activationId,
          userId: smsRent.user_id,
          refund: smsRent.cost
        });
      }
    } catch (error) {
      logger.error('Error in SMS polling', {
        activationId: activationId,
        error: error.message
      });
    }
  }, pollInterval);

  activePolls.set(activationId, pollId);
}

module.exports = {
  startSmsPolling
};
