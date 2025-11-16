require('dotenv').config();
const express = require('express');
const {Télégrafo} = require('telégrafo');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

// --- Configuração do PostgreSQL/Sequelize ---
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialeto: 'postgres',
  registro: falso
});

const User = sequelize.define('User', {
  telegram_id: { type: DataTypes.STRING, unique: true },
  nome de usuário: DataTypes.STRING,
  first_name: DataTypes.STRING,
  saldo: { tipo: DataTypes.FLOAT, valor padrão: 0 }
}, { tableName: 'users', timestamps: false });

const Transaction = sequelize.define('Transaction', {
  telegram_id: DataTypes.STRING,
  tipo: DataTypes.STRING,
  quantidade: DataTypes.FLOAT,
  status: DataTypes.STRING,
  Detalhes: DataTypes.JSONB
}, { tableName: 'transações', timestamps: true });

// --- Express + Telegram ---
const app = express();
app.use(bodyParser.json());
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Utilitário
função assíncrona getOrCreateUser(ctx) {
  let user = await User.findOne({ where: { telegram_id: String(ctx.from.id) }});
  se (!usuário) {
    usuário = await User.create({
      telegram_id: String(ctx.from.id),
      nome de usuário: ctx.from.username,
      primeiro_nome: ctx.from.primeiro_nome,
      saldo: 0
    });
  }
  retornar usuário;
}

// --- COMANDOS --------------------------------------------------------------------------------------------

bot.start(async (ctx) => {
  aguarde getOrCreateUser(ctx);
  ctx.responder(
    'ðŸ¤– Bem-vindo!\n\n' +
    'Comandos disponíveis:\n' +
    '/saldo - ver saldo\n' +
    '/adicionar_saldo - adicionar saldo via PIX\n' +
    '/sms - comprar SMS\n' +
    '/seguidores - comprar seguidores'
  );
});

bot.command('saldo', async (ctx) => {
  let user = await getOrCreateUser(ctx);
  ctx.reply(`ðŸ'° Seu saldo: R$${user.balance.toFixed(2)}`);
});

// --- ADICIONAR SALDO VIA PIX -----------------------------------------------------------------------------------

bot.command('adicionar_saldo', async (ctx) => {
  ctx.reply('Digite o valor em R$ que deseja adicionar:');

  bot.once('text', async (msgCtx) => {
    se (!/^[0-9]+$/.test(msgCtx.message.text))
      return msgCtx.reply('Digite apenas números.');

    deixe valor = parseFloat(msgCtx.message.text);

    let response = await axios.post(`${process.env.PIXINTEGRA_BASE_URL}/charge`, {
      apiKey: process.env.PIXINTEGRA_API_TOKEN,
      quantidade: valor
    });

    aguarde Transaction.create({
      telegram_id: String(msgCtx.from.id),
      tipo: 'pix',
      quantidade: valor,
      status: 'pendente',
      detalhes: { pixid: response.data.id }
    });

    msgCtx.responder(
      `Pague o Pix para adicionar saldo:\n\n` +
      (response.data.copyPaste || response.data.qrCodeText || 'QR CODE INDISPONÍVEL')
    );
  });
});

// --- COMPRAR SMS ----------------------------------------------------------------------------

bot.command('sms', async (ctx) => {
  ctx.reply('Escolha o serviço:\n1. WhatsApp\n2. Telegram\n3. Instagram\n4. Facebook\n5. Google');

  bot.once('text', async (msgCtx) => {
    const servico =
      ['whatsapp', 'telegram', 'instagram', 'facebook', 'google'][parseInt(msgCtx.message.text) - 1];

    ctx.reply('Qual país? Exemplo: 6 = Brasil');

    bot.once('text', async (paisCtx) => {
      let country = paisCtx.message.text;
      let user = await getOrCreateUser(ctx);

      seja valor = 2; // valor fixo só para exemplo

      se (saldo do usuário < valor)
        return paisCtx.reply('âš ï¸ Saldo insuficiente. Use /adicionar_saldo');

      paisCtx.reply(`Confirmar compra de ${serviço}? (Sim/Nao)`);

      bot.ouve(/^sim$/i, async (confCtx) => {
        saldo do usuário -= valor;
        aguarde user.save();

        aguarde Transaction.create({
          telegram_id: String(ctx.from.id),
          tipo: 'sms',
          quantidade: valor,
          status: 'concluído',
          detalhes: { serviço, país }
        });

        let smsRes = await axios.get(
          `${process.env.SMS_ACTIVATE_BASE_URL}/stubs/handler_api.php?api_key=${process.env.SMS_ACTIVATE_API_KEY}&action=getNumber&service=${servico}&country=${country}`
        );

        let parts = smsRes.data.split(':');
        let activationId = parts[1];
        seja numero = partes[2];

        confCtx.reply(`Número adquirido: ${numero}`);

        seja feito = falso;

        para (seja i = 0; i < 12; i++) {
          let res2 = await axios.get(
            `${process.env.SMS_ACTIVATE_BASE_URL}/stubs/handler_api.php?api_key=${process.env.SMS_ACTIVATE_API_KEY}&action=getStatus&id=${activationId}`
          );

          se (res2.data.include('STATUS_OK')) {
            confCtx.reply(`Código SMS: ${res2.data.split(':')[1]}`);
            feito = verdadeiro;
            quebrar;
          }

          await new Promise((r) => setTimeout(r, 5000));
        }

        if (!done) confCtx.reply('Tempo esgotado para receber o código.');
      });
    });
  });
});

// --- COMPRAR SEGUIDORES ----------------------------------------------------------------------------

bot.command('seguidores', async (ctx) => {
  ctx.reply('Plataforma:\n1. Instagram\n2. TikTok\n3. YouTube\n4. Twitter\n5. Facebook');

  bot.once('text', async (msgCtx) => {
    const plataforma =
      ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'][parseInt(msgCtx.message.text) - 1];

    ctx.reply('Digite o nome de usuário sem @');

    bot.once('texto', async (usuCtx) => {
      let username = usuCtx.message.text.replace('@', '');

      ctx.reply('Quantos seguidores desejam?');

      bot.once('texto', async (qtdCtx) => {
        let qtd = parseInt(qtdCtx.message.text);
        seja valor = qtd * 0,05;

        let user = await getOrCreateUser(ctx);

        se (saldo do usuário < valor)
          return qtdCtx.reply('âš ï¸ Saldo insuficiente.');

        qtdCtx.reply(`Confirmar compra? (Sim/Nao)`);

        bot.ouve(/^sim$/i, async (confCtx) => {
          saldo do usuário -= valor;
          aguarde user.save();

          aguarde Transaction.create({
            telegram_id: String(ctx.from.id),
            tipo: 'seguidores',
            quantidade: valor,
            status: 'concluído',
            detalhes: { plataforma, nome de usuário, citação }
          });

          aguarde axios.post(
            `${process.env.APEX_BASE_URL}${process.env.APEX_CREATE_ORDER_PATH}`,
            {
              chave: process.env.APEX_API_KEY,
              serviço: plataforma,
              link: nome de usuário,
              quantidade: qtd
            }
          );

          confCtx.reply('Pedido enviado com sucesso!');
        });
      });
    });
  });
});

// --- WEBHOOK PIXINTEGRA ------------------------------------------------------------------------

app.post('/webhook/pixintegra', async (req, res) => {
  const { pixid, status } = req.body;

  se (status === 'pago' || status === 'aprovado') {
    let tx = await Transaction.findOne({
      onde: { 'details.pixid': pixid, status: 'pending' }
    });

    se (tx) {
      tx.status = 'pago';
      aguarde tx.save();

      let user = await User.findOne({ where: { telegram_id: tx.telegram_id }});

      se (usuário) {
        saldo do usuário += valor da transação;
        aguarde user.save();

        aguarde bot.telegram.sendMessage(
          usuário.telegram_id,
          `Pix confirmado! Novo saldo: R$${user.balance.toFixed(2)}`
        );
      }
    }
  }

  res.json({ ok: true });
});

// --- Saúde + Iniciar ------------------------------------------------------------------------

app.get('/health', (req, res) => res.json({
  status: 'saudável',
  tempo de atividade: process.uptime()
}));

app.listen(process.env.PORT, async () => {
  aguarde sequelize.sync();
  bot.lançar();
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});

process.on('unhandledRejection', e => console.error(e));
process.on('uncaughtException', e => console.error(e));
