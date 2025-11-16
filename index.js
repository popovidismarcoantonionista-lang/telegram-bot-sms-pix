require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

// --- PostgreSQL/Sequelize Setup ---
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const User = sequelize.define('User', {
  telegram_id: { type: DataTypes.STRING, unique: true },
  username: DataTypes.STRING,
  first_name: DataTypes.STRING,
  balance: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { tableName: 'users', timestamps: false });

const Transaction = sequelize.define('Transaction', {
  telegram_id: DataTypes.STRING,
  type: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  status: DataTypes.STRING,
  details: DataTypes.JSONB
}, { tableName: 'transactions', timestamps: true });

// --- Express + Telegram ---
const app = express();
app.use(bodyParser.json());
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Utility
async function getOrCreateUser(ctx) {
  let user = await User.findOne({ where: { telegram_id: String(ctx.from.id) }});
  if (!user) {
    user = await User.create({
      telegram_id: String(ctx.from.id),
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      balance: 0
    });
  }
  return user;
}

// --- COMANDOS ----------------------------------------------------------------------------------------

bot.start(async (ctx) => {
  await getOrCreateUser(ctx);
  ctx.reply(
    'ðŸ¤– Bem-vindo!\n\n' +
    'Comandos disponÃ­veis:\n' +
    '/saldo - ver saldo\n' +
    '/adicionar_saldo - adicionar saldo via PIX\n' +
    '/sms - comprar SMS\n' +
    '/seguidores - comprar seguidores'
  );
});

bot.command('saldo', async (ctx) => {
  let user = await getOrCreateUser(ctx);
  ctx.reply(`ðŸ’° Seu saldo: R$${user.balance.toFixed(2)}`);
});

// --- ADICIONAR SALDO VIA PIX -------------------------------------------------------------------------

bot.command('adicionar_saldo', async (ctx) => {
  ctx.reply('Digite o valor em R$ que deseja adicionar:');

  bot.once('text', async (msgCtx) => {
    if (!/^[0-9]+$/.test(msgCtx.message.text))
      return msgCtx.reply('Digite apenas nÃºmeros.');

    let valor = parseFloat(msgCtx.message.text);

    let response = await axios.post(`${process.env.PIXINTEGRA_BASE_URL}/charge`, {
      apiKey: process.env.PIXINTEGRA_API_TOKEN,
      amount: valor
    });

    await Transaction.create({
      telegram_id: String(msgCtx.from.id),
      type: 'pix',
      amount: valor,
      status: 'pending',
      details: { pixid: response.data.id }
    });

    msgCtx.reply(
      `Pague o Pix para adicionar saldo:\n\n` +
      (response.data.copyPaste || response.data.qrCodeText || 'QR CODE INDISPONÃVEL')
    );
  });
});

// --- COMPRAR SMS -------------------------------------------------------------------------------------

bot.command('sms', async (ctx) => {
  ctx.reply('Escolha o serviÃ§o:\n1. WhatsApp\n2. Telegram\n3. Instagram\n4. Facebook\n5. Google');

  bot.once('text', async (msgCtx) => {
    const servico =
      ['whatsapp', 'telegram', 'instagram', 'facebook', 'google'][parseInt(msgCtx.message.text) - 1];

    ctx.reply('Qual paÃ­s? Exemplo: 6 = Brasil');

    bot.once('text', async (paisCtx) => {
      let country = paisCtx.message.text;
      let user = await getOrCreateUser(ctx);

      let valor = 2; // valor fixo sÃ³ para exemplo

      if (user.balance < valor)
        return paisCtx.reply('âš ï¸ Saldo insuficiente. Use /adicionar_saldo');

      paisCtx.reply(`Confirmar compra de ${servico}? (Sim/Nao)`);

      bot.hears(/^sim$/i, async (confCtx) => {
        user.balance -= valor;
        await user.save();

        await Transaction.create({
          telegram_id: String(ctx.from.id),
          type: 'sms',
          amount: valor,
          status: 'done',
          details: { servico, country }
        });

        let smsRes = await axios.get(
          `${process.env.SMS_ACTIVATE_BASE_URL}/stubs/handler_api.php?api_key=${process.env.SMS_ACTIVATE_API_KEY}&action=getNumber&service=${servico}&country=${country}`
        );

        let parts = smsRes.data.split(':');
        let activationId = parts[1];
        let numero = parts[2];

        confCtx.reply(`NÃºmero adquirido: ${numero}`);

        let done = false;

        for (let i = 0; i < 12; i++) {
          let res2 = await axios.get(
            `${process.env.SMS_ACTIVATE_BASE_URL}/stubs/handler_api.php?api_key=${process.env.SMS_ACTIVATE_API_KEY}&action=getStatus&id=${activationId}`
          );

          if (res2.data.includes('STATUS_OK')) {
            confCtx.reply(`CÃ³digo SMS: ${res2.data.split(':')[1]}`);
            done = true;
            break;
          }

          await new Promise((r) => setTimeout(r, 5000));
        }

        if (!done) confCtx.reply('Tempo esgotado para receber o cÃ³digo.');
      });
    });
  });
});

// --- COMPRAR SEGUIDORES ------------------------------------------------------------------------------

bot.command('seguidores', async (ctx) => {
  ctx.reply('Plataforma:\n1. Instagram\n2. TikTok\n3. YouTube\n4. Twitter\n5. Facebook');

  bot.once('text', async (msgCtx) => {
    const plataforma =
      ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'][parseInt(msgCtx.message.text) - 1];

    ctx.reply('Digite o username sem @');

    bot.once('text', async (usuCtx) => {
      let username = usuCtx.message.text.replace('@', '');

      ctx.reply('Quantos seguidores deseja?');

      bot.once('text', async (qtdCtx) => {
        let qtd = parseInt(qtdCtx.message.text);
        let valor = qtd * 0.05;

        let user = await getOrCreateUser(ctx);

        if (user.balance < valor)
          return qtdCtx.reply('âš ï¸ Saldo insuficiente.');

        qtdCtx.reply(`Confirmar compra? (Sim/Nao)`);

        bot.hears(/^sim$/i, async (confCtx) => {
          user.balance -= valor;
          await user.save();

          await Transaction.create({
            telegram_id: String(ctx.from.id),
            type: 'seguidores',
            amount: valor,
            status: 'done',
            details: { plataforma, username, qtd }
          });

          await axios.post(
            `${process.env.APEX_BASE_URL}${process.env.APEX_CREATE_ORDER_PATH}`,
            {
              key: process.env.APEX_API_KEY,
              service: plataforma,
              link: username,
              quantity: qtd
            }
          );

          confCtx.reply('Pedido enviado com sucesso!');
        });
      });
    });
  });
});

// --- WEBHOOK PIXINTEGRA ------------------------------------------------------------------------------

app.post('/webhook/pixintegra', async (req, res) => {
  const { pixid, status } = req.body;

  if (status === 'paid' || status === 'approved') {
    let tx = await Transaction.findOne({
      where: { 'details.pixid': pixid, status: 'pending' }
    });

    if (tx) {
      tx.status = 'paid';
      await tx.save();

      let user = await User.findOne({ where: { telegram_id: tx.telegram_id }});

      if (user) {
        user.balance += tx.amount;
        await user.save();

        await bot.telegram.sendMessage(
          user.telegram_id,
          `Pix confirmado! Novo saldo: R$${user.balance.toFixed(2)}`
        );
      }
    }
  }

  res.json({ ok: true });
});

// --- Health + Start ----------------------------------------------------------------------------------

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  uptime: process.uptime()
}));

app.listen(process.env.PORT, async () => {
  await sequelize.sync();
  bot.launch();
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});

process.on('unhandledRejection', e => console.error(e));
process.on('uncaughtException', e => console.error(e));
