// index.js - Telegram Bot principal
require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const { getMenu } = require('./menu');
const { getSaldo, addSaldo, lancarTransacao } = require('./database');
const pix = require('./services/pix');
const sms = require('./services/sms');
const apex = require('./services/apex');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session()); // para fluxo interativo

bot.start(async ctx => {
  await ctx.reply('Bem-vindo!\nComandos disponíveis:', getMenu());
});

bot.hears('💳 Comprar créditos', async ctx => {
  ctx.session.state = 'AGUARDANDO_PIX';
  await ctx.reply('Qual valor dos créditos que deseja adicionar? (R$ ex: 10)');
});

bot.on('text', async ctx => {
  // Comprar créditos (PIX)
  if (ctx.session.state === 'AGUARDANDO_PIX') {
    const valor = parseFloat(ctx.message.text.replace(',', '.'));
    if (isNaN(valor) || valor < 1) return ctx.reply('Valor inválido! Envie apenas números, ex: 5');
    try {
      const cob = await pix.criarCobrancaPIX(ctx.from.id, valor);
      ctx.session.ultimo_pix_id = cob.id;
      ctx.session.ultimo_valor_pix = valor;
      ctx.reply(`Para pagar, escaneie o QR CODE ou copie o código abaixo:\n\nQR Code: ${cob.qrCode}\n\nCopia e cola:\n${cob.qrCodeText}\n\nAviso: Assim que o pagamento for confirmado, seu saldo será liberado automaticamente!`);
    } catch (e) {
      ctx.reply('Erro ao criar cobrança PIX. Tente novamente.');
    }
    ctx.session.state = null;
    return;
  }

  // SMS: comprar número, buscar código, cancelar etc. (Fluxo simplificado para exemplo)
  // Apex: comprar seguidores, consultar status etc.
  // TODO: Implemente o restante dos fluxos detalhados.
});

bot.hears('📱 SMS Virtual', ctx => { ctx.reply('Digite o serviço desejado para SMS (Ex: WhatsApp)'); });
bot.hears('👥 Comprar seguidores', ctx => { ctx.reply('Digite o username para os seguidores:'); });
bot.hears('📦 Status do pedido', ctx => { ctx.reply('Envie o ID do pedido para consultar o status.'); });
bot.hears('❓ Suporte', ctx => { ctx.reply('Contato suporte: @SeuSuporte'); });

bot.command('saldo', async ctx => {
  const saldo = await getSaldo(ctx.from.id);
  ctx.reply(`Seu saldo: R$${saldo.toFixed(2)}`);
});

module.exports = bot.launch();
