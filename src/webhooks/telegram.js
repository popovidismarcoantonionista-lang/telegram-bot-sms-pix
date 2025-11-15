const express = require('express');
const startHandler = require('../bot/handlers/start');
const { comprarCreditosHandler, handlePackageSelection, handleAmountInput } = require('../bot/handlers/comprarCreditos');
const { comprarSmsHandler, handleServiceSelection } = require('../bot/handlers/comprarSms');
const { comprarSeguidoresHandler, handlePlatformSelection, handleQuantityInput, handleUrlInput } = require('../bot/handlers/comprarSeguidores');
const { getUserByTgId } = require('../database/models/User');
const logger = require('../utils/logger');

module.exports = function(bot) {
  const router = express.Router();

  // Registrar handlers de comandos
  bot.command('start', startHandler);
  bot.command('comprar_creditos', comprarCreditosHandler);
  bot.command('comprar_sms', comprarSmsHandler);
  bot.command('comprar_seguidores', comprarSeguidoresHandler);

  // Handler de saldo
  bot.command('saldo', async (ctx) => {
    try {
      const user = await getUserByTgId(ctx.from.id);
      await ctx.reply(
        `💰 *Seu Saldo*\n\n` +
        `R$ ${user.balance.toFixed(2)}\n\n` +
        `📦 Pacote: ${user.tier.toUpperCase()}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Error in saldo command', { error: error.message });
      await ctx.reply('❌ Erro ao consultar saldo.');
    }
  });

  // Callbacks inline
  bot.action(/^package:/, handlePackageSelection);
  bot.action(/^followers_platform:/, handlePlatformSelection);

  // Handlers de texto
  bot.on('text', async (ctx) => {
    if (ctx.session?.awaitingService) {
      await handleServiceSelection(ctx);
    } else if (ctx.session?.awaitingFollowersQuantity) {
      await handleQuantityInput(ctx);
    } else if (ctx.session?.awaitingFollowersUrl) {
      await handleUrlInput(ctx);
    } else if (ctx.session?.selectedTier) {
      await handleAmountInput(ctx);
    }
  });

  // Webhook endpoint
  router.post('/', (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  return router;
};
