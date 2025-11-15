const { getUserByTgId, createUser } = require('../../database/models/User');
const { welcomeMessage } = require('../messages');
const logger = require('../../utils/logger');

async function startHandler(ctx) {
  try {
    const tgId = ctx.from.id;
    const username = ctx.from.username || 'Anônimo';

    // Buscar ou criar usuário
    let user = await getUserByTgId(tgId);
    if (!user) {
      user = await createUser({
        tg_id: tgId,
        username: username,
        balance: 0
      });
      logger.info('New user registered', { tgId, username });
    }

    await ctx.reply(welcomeMessage(user), {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['💰 Comprar Créditos', '📱 Comprar SMS'],
          ['👥 Comprar Seguidores', '💳 Meu Saldo'],
          ['📊 Histórico', '❓ Ajuda']
        ],
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error('Error in start handler', { error: error.message, userId: ctx.from.id });
    await ctx.reply('❌ Erro ao iniciar. Tente novamente.');
  }
}

module.exports = startHandler;
