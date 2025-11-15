require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar bot Telegram
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  webHook: { port: PORT }
});

// Configurar webhook
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `https://web-production-14b8.up.railway.app/webhook/telegram`;
bot.setWebHook(webhookUrl);

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Telegram Bot SMS/PIX',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    bot: 'Active'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    webhook: webhookUrl
  });
});

// Webhook do Telegram
app.post('/webhook/telegram', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Webhook PixIntegra
app.post('/webhook/pixintegra', (req, res) => {
  console.log('PixIntegra webhook:', req.body);
  // TODO: Processar pagamento PIX
  res.status(200).json({ ok: true });
});

// ========== COMANDOS DO BOT ==========

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'usuário';

  const welcomeMessage = `
🤖 *Olá, ${firstName}!*

Bem-vindo ao *Bot SMS/PIX* 🎉

📱 Aqui você pode:
✅ Comprar números SMS temporários
✅ Comprar seguidores para redes sociais
✅ Pagar com PIX automático

💰 *Saldo atual:* R$ 0,00

👇 Use os botões abaixo para começar:
  `.trim();

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📱 Comprar SMS', callback_data: 'buy_sms' },
          { text: '👥 Comprar Seguidores', callback_data: 'buy_followers' }
        ],
        [
          { text: '💰 Adicionar Saldo', callback_data: 'add_balance' },
          { text: '📊 Ver Saldo', callback_data: 'check_balance' }
        ],
        [
          { text: '❓ Ajuda', callback_data: 'help' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, { 
    parse_mode: 'Markdown',
    ...keyboard 
  });
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
📖 *AJUDA - Como Usar o Bot*

*Comandos Disponíveis:*
/start - Iniciar o bot
/help - Ver esta ajuda
/saldo - Verificar seu saldo
/comprar - Comprar SMS ou seguidores
/suporte - Contatar suporte

*Como Funcionar:*
1️⃣ Adicione saldo via PIX
2️⃣ Escolha o serviço (SMS ou Seguidores)
3️⃣ Selecione o país/rede social
4️⃣ Confirme a compra
5️⃣ Receba seu número/pedido

💬 *Suporte:* @seu_suporte
⏰ *Horário:* 24/7 Automático
  `.trim();

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Comando /saldo
bot.onText(/\/saldo/, (msg) => {
  const chatId = msg.chat.id;

  // TODO: Buscar saldo real do banco de dados
  const saldo = 0.00;

  const message = `
💰 *SEU SALDO*

Saldo Atual: R$ ${saldo.toFixed(2)}

Para adicionar saldo, clique no botão abaixo:
  `.trim();

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Adicionar Saldo', callback_data: 'add_balance' }]
      ]
    }
  };

  bot.sendMessage(chatId, message, { 
    parse_mode: 'Markdown',
    ...keyboard 
  });
});

// ========== CALLBACK QUERIES (BOTÕES) ==========

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  // Responder ao clique do botão
  bot.answerCallbackQuery(query.id);

  switch(data) {
    case 'buy_sms':
      bot.sendMessage(chatId, `
📱 *COMPRAR SMS*

Selecione o país:
      `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇧🇷 Brasil', callback_data: 'sms_br' }],
            [{ text: '🇺🇸 EUA', callback_data: 'sms_us' }],
            [{ text: '🇷🇺 Rússia', callback_data: 'sms_ru' }],
            [{ text: '⬅️ Voltar', callback_data: 'back_main' }]
          ]
        }
      });
      break;

    case 'buy_followers':
      bot.sendMessage(chatId, `
👥 *COMPRAR SEGUIDORES*

Selecione a rede social:
      `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📸 Instagram', callback_data: 'followers_ig' }],
            [{ text: '🎵 TikTok', callback_data: 'followers_tiktok' }],
            [{ text: '📘 Facebook', callback_data: 'followers_fb' }],
            [{ text: '⬅️ Voltar', callback_data: 'back_main' }]
          ]
        }
      });
      break;

    case 'add_balance':
      bot.sendMessage(chatId, `
💰 *ADICIONAR SALDO*

Digite o valor que deseja adicionar:
Exemplo: 10 (para R$ 10,00)

Mínimo: R$ 5,00
Máximo: R$ 1.000,00

Após enviar o valor, você receberá o QR Code PIX para pagamento.
      `.trim(), { parse_mode: 'Markdown' });
      break;

    case 'check_balance':
      const saldo = 0.00; // TODO: Buscar do banco
      bot.sendMessage(chatId, `
💰 *SEU SALDO*

Saldo Atual: R$ ${saldo.toFixed(2)}

Últimas transações:
• Nenhuma transação ainda

Para adicionar saldo, use /saldo
      `.trim(), { parse_mode: 'Markdown' });
      break;

    case 'help':
      bot.sendMessage(chatId, `
❓ *PRECISA DE AJUDA?*

Entre em contato:
📧 Email: suporte@seubot.com
💬 Telegram: @seu_suporte
⏰ Horário: 24/7

Ou use /help para ver os comandos disponíveis.
      `.trim(), { parse_mode: 'Markdown' });
      break;

    case 'back_main':
      bot.sendMessage(chatId, '⬅️ Voltando ao menu principal...');
      // Simular /start
      bot.emit('message', { 
        chat: { id: chatId }, 
        from: query.from,
        text: '/start' 
      });
      break;

    default:
      bot.sendMessage(chatId, '⚠️ Função em desenvolvimento! Em breve disponível.');
  }
});

// ========== PROCESSAR MENSAGENS DE TEXTO ==========

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignorar comandos (já processados acima)
  if (text && text.startsWith('/')) return;

  // Verificar se é um valor numérico (para adicionar saldo)
  const valor = parseFloat(text);
  if (!isNaN(valor) && valor >= 5 && valor <= 1000) {
    bot.sendMessage(chatId, `
✅ *Valor recebido: R$ ${valor.toFixed(2)}*

🔄 Gerando QR Code PIX...

⏳ Aguarde alguns segundos...
    `.trim(), { parse_mode: 'Markdown' });

    // TODO: Gerar PIX com PixIntegra
    setTimeout(() => {
      bot.sendMessage(chatId, `
📱 *QR CODE PIX*

💰 Valor: R$ ${valor.toFixed(2)}

⚠️ *Em desenvolvimento*
Em breve você receberá o QR Code aqui!

Por enquanto, entre em contato com o suporte para adicionar saldo manualmente.
      `.trim(), { parse_mode: 'Markdown' });
    }, 2000);

    return;
  }

  // Resposta padrão
  bot.sendMessage(chatId, `
Olá! 👋

Digite /start para ver o menu principal.
Digite /help para ver os comandos disponíveis.
  `.trim());
});

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'Configurado ✓' : 'FALTANDO ✗'}`);
  console.log(`🔗 Webhook URL: ${webhookUrl}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configurado ✓' : 'FALTANDO ✗'}`);
  console.log(`\n🚀 Bot pronto para receber mensagens!`);
});

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Tratamento de erros do bot
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});
