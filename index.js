require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());

// Configurar bot do Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Mensagens
const messages = {
  start: `🤖 *Bem-vindo ao Bot SMS/PIX!*

Olá! Eu sou seu assistente para compra de:
📱 *Números SMS temporários* (SMS-Activate)
👥 *Seguidores para redes sociais* (Apex Seguidores)
💰 *Pagamento via PIX* (PixIntegra)

*Comandos disponíveis:*
/start - Iniciar o bot
/sms - Comprar números SMS
/seguidores - Comprar seguidores
/saldo - Ver seu saldo
/ajuda - Obter ajuda

_Escolha uma opção acima para começar!_`,

  sms: `📱 *Comprar Números SMS*

Você pode comprar números temporários para receber SMS de verificação.

*Serviços disponíveis:*
- WhatsApp
- Telegram
- Instagram
- Facebook
- Google
- E muito mais!

_Em breve: sistema completo de compra_`,

  seguidores: `👥 *Comprar Seguidores*

Aumente seus seguidores nas redes sociais!

*Plataformas disponíveis:*
- Instagram
- TikTok
- YouTube
- Twitter/X
- Facebook

_Em breve: sistema completo de compra_`,

  saldo: `💰 *Seu Saldo*

Saldo atual: R$ 0,00

Para adicionar saldo, faça um pagamento via PIX.

_Sistema de pagamento em desenvolvimento_`,

  ajuda: `ℹ️ *Ajuda*

*Como usar o bot:*
1️⃣ Use /sms para comprar números
2️⃣ Use /seguidores para seguidores
3️⃣ Use /saldo para ver seu crédito

*Precisa de suporte?*
Entre em contato com o administrador.

*Status do sistema:*
✅ Bot online
✅ Webhooks ativos
⚠️ Pagamentos em desenvolvimento`
};

// Comandos do bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, messages.start, { parse_mode: 'Markdown' });
});

bot.onText(/\/sms/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, messages.sms, { parse_mode: 'Markdown' });
});

bot.onText(/\/seguidores/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, messages.seguidores, { parse_mode: 'Markdown' });
});

bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, messages.saldo, { parse_mode: 'Markdown' });
});

bot.onText(/\/ajuda/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, messages.ajuda, { parse_mode: 'Markdown' });
});

// Mensagens de texto normal
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    `Olá! 👋\n\nRecebi sua mensagem: "${msg.text}"\n\nUse /start para ver os comandos disponíveis.`
  );
});

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Telegram Bot SMS & Seguidores',
    bot_active: true,
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    bot_token: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
    database: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
});

// Webhook do Telegram
app.post('/webhook/telegram', (req, res) => {
  console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Webhook do PixIntegra
app.post('/webhook/pixintegra', (req, res) => {
  console.log('💰 PixIntegra webhook:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ ok: true });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'Configurado ✓' : 'FALTANDO ✗'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configurado ✓' : 'FALTANDO ✗'}`);

  // Configurar webhook
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    try {
      await bot.setWebHook(process.env.TELEGRAM_WEBHOOK_URL);
      console.log(`🔗 Webhook configurado: ${process.env.TELEGRAM_WEBHOOK_URL}`);
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error.message);
    }
  } else {
    console.warn('⚠️  TELEGRAM_WEBHOOK_URL não configurado');
  }
});

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Tratamento de erros do bot
bot.on('polling_error', (error) => {
  console.error('❌ Bot polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('❌ Bot webhook error:', error);
});
