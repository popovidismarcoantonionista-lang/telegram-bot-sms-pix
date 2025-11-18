import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import db from './database.js';
import pix from './pix.js';
import sms from './sms.js';
import apex from './apex.js';
import logger from './logger.js';
import { mainMenu, smsMenu, seguidoresMenu, cancelMenu, messages, formatBalance } from './menu.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT) || 1.00;

// Inicializar bot
const bot = new TelegramBot(BOT_TOKEN);

// Estados temporários dos usuários
const userStates = new Map();

// Express para webhook
const app = express();
app.use(express.json());

// ===== FUNÇÕES AUXILIARES =====

function setState(userId, state, data = {}) {
  userStates.set(userId, { state, data, timestamp: Date.now() });
}

function getState(userId) {
  return userStates.get(userId) || null;
}

function clearState(userId) {
  userStates.delete(userId);
}

function sendMessage(chatId, text, options = {}) {
  return bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...options
  });
}

// ===== REGISTRO DE USUÁRIO =====

async function registerUser(msg) {
  const userId = msg.from.id;
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || 'Usuário';

  let user = db.getUser(userId);

  if (!user) {
    db.createUser(userId, username, firstName);
    logger.info('Novo usuário registrado', { userId, username });
  }

  return db.getUser(userId);
}

// ===== COMANDO /START =====

bot.onText(/\/start/, async (msg) => {
  try {
    const user = await registerUser(msg);
    await sendMessage(msg.chat.id, messages.welcome(user.first_name), mainMenu);
    logger.info('Comando /start executado', { userId: user.telegram_id });
  } catch (error) {
    logger.error('Erro no /start', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao iniciar o bot.'));
  }
});

// ===== COMANDO /SALDO =====

bot.onText(/\/saldo/, async (msg) => {
  try {
    await registerUser(msg);
    const userId = msg.from.id;
    const balance = db.getUserBalance(userId);

    await sendMessage(msg.chat.id, messages.balance(balance, userId));
    logger.info('Comando /saldo executado', { userId, balance });
  } catch (error) {
    logger.error('Erro no /saldo', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao consultar saldo.'));
  }
});

// ===== COMANDO /DEPOSITAR =====

bot.onText(/\/depositar/, async (msg) => {
  try {
    await registerUser(msg);
    const userId = msg.from.id;

    setState(userId, 'awaiting_deposit_amount');
    await sendMessage(msg.chat.id, messages.deposit(MIN_DEPOSIT), cancelMenu);

    logger.info('Comando /depositar executado', { userId });
  } catch (error) {
    logger.error('Erro no /depositar', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao iniciar depósito.'));
  }
});

// ===== COMANDO /SMS =====

bot.onText(/\/sms/, async (msg) => {
  try {
    await registerUser(msg);
    await sendMessage(msg.chat.id, messages.smsServices, smsMenu);
    logger.info('Comando /sms executado', { userId: msg.from.id });
  } catch (error) {
    logger.error('Erro no /sms', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao abrir menu SMS.'));
  }
});

// ===== COMANDO /SEGUIDORES =====

bot.onText(/\/seguidores/, async (msg) => {
  try {
    await registerUser(msg);
    await sendMessage(msg.chat.id, messages.seguidoresCategories, seguidoresMenu);
    logger.info('Comando /seguidores executado', { userId: msg.from.id });
  } catch (error) {
    logger.error('Erro no /seguidores', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao abrir menu de seguidores.'));
  }
});

// ===== COMANDO /SUPORTE =====

bot.onText(/\/suporte/, async (msg) => {
  try {
    await sendMessage(msg.chat.id, messages.support);
    logger.info('Comando /suporte executado', { userId: msg.from.id });
  } catch (error) {
    logger.error('Erro no /suporte', error);
  }
});

// ===== COMANDO /HISTORICO =====

bot.onText(/\/historico/, async (msg) => {
  try {
    await registerUser(msg);
    const userId = msg.from.id;
    const transactions = db.getTransactions(userId, 10);

    await sendMessage(msg.chat.id, messages.history(transactions));
    logger.info('Comando /historico executado', { userId });
  } catch (error) {
    logger.error('Erro no /historico', error);
    await sendMessage(msg.chat.id, messages.error('Erro ao buscar histórico.'));
  }
});

// ===== HANDLER DE MENSAGENS DE TEXTO =====

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // Ignorar comandos

  try {
    const userId = msg.from.id;
    const state = getState(userId);

    if (!state) {
      // Atalhos do menu
      if (msg.text === '💰 Depositar') {
        return bot.emit('text', { ...msg, text: '/depositar' });
      }
      if (msg.text === '💳 Saldo') {
        return bot.emit('text', { ...msg, text: '/saldo' });
      }
      if (msg.text === '📱 SMS Descartável') {
        return bot.emit('text', { ...msg, text: '/sms' });
      }
      if (msg.text === '👥 Seguidores') {
        return bot.emit('text', { ...msg, text: '/seguidores' });
      }
      if (msg.text === '📊 Histórico') {
        return bot.emit('text', { ...msg, text: '/historico' });
      }
      if (msg.text === '💬 Suporte') {
        return bot.emit('text', { ...msg, text: '/suporte' });
      }
      return;
    }

    // ===== PROCESSAR VALOR DO DEPÓSITO =====
    if (state.state === 'awaiting_deposit_amount') {
      const amount = parseFloat(msg.text.replace(',', '.'));

      if (isNaN(amount) || amount < MIN_DEPOSIT) {
        return sendMessage(msg.chat.id, 
          `❌ Valor inválido! O depósito mínimo é ${formatBalance(MIN_DEPOSIT)}`
        );
      }

      await sendMessage(msg.chat.id, '⏳ Gerando cobrança PIX...');

      const result = await pix.createCharge(amount, `Depósito - User ${userId}`);

      if (!result.success) {
        clearState(userId);
        return sendMessage(msg.chat.id, messages.error('Erro ao gerar cobrança PIX. Tente novamente.'));
      }

      // Salvar no banco
      db.createPixDeposit(userId, result.txid, amount, result.qrCode, result.qrCodeImage);
      db.createTransaction(userId, 'deposit', amount, 'Depósito PIX', 'pending', result.txid);

      // Enviar QR Code
      await bot.sendPhoto(msg.chat.id, result.qrCodeImage, {
        caption: messages.depositCreated(amount, result.qrCode),
        parse_mode: 'Markdown'
      });

      // Monitorar pagamento
      monitorPayment(userId, result.txid, msg.chat.id);

      clearState(userId);
      logger.info('Depósito criado', { userId, amount, txid: result.txid });
    }

    // ===== PROCESSAR LINK PARA SEGUIDORES =====
    if (state.state === 'awaiting_seguidores_link') {
      const link = msg.text.trim();

      if (!link.startsWith('http')) {
        return sendMessage(msg.chat.id, '❌ Link inválido! Envie um link completo começando com http:// ou https://');
      }

      setState(userId, 'awaiting_seguidores_quantity', { 
        ...state.data, 
        link 
      });

      await sendMessage(msg.chat.id, messages.seguidoresQuantity(state.data.service));
    }

    // ===== PROCESSAR QUANTIDADE DE SEGUIDORES =====
    if (state.state === 'awaiting_seguidores_quantity') {
      const quantity = parseInt(msg.text);
      const service = state.data.service;

      if (isNaN(quantity) || quantity < service.min || quantity > service.max) {
        return sendMessage(msg.chat.id, 
          `❌ Quantidade inválida! Mínimo: ${service.min} | Máximo: ${service.max.toLocaleString('pt-BR')}`
        );
      }

      const price = apex.calculatePrice(service.rate, quantity);
      const balance = db.getUserBalance(userId);

      if (balance < price) {
        clearState(userId);
        return sendMessage(msg.chat.id, messages.insufficientBalance(price, balance));
      }

      // Criar pedido
      await sendMessage(msg.chat.id, '⏳ Criando pedido...');

      const result = await apex.createOrder(service.id, state.data.link, quantity);

      if (!result.success) {
        clearState(userId);
        return sendMessage(msg.chat.id, messages.error(result.error));
      }

      // Debitar saldo
      db.updateBalance(userId, price, 'subtract');
      db.createTransaction(userId, 'purchase', -price, `Seguidores ${service.category}`, 'completed', result.orderId);
      db.createApexOrder(userId, result.orderId, service.id, state.data.link, quantity, price);

      await sendMessage(msg.chat.id, messages.seguidoresSuccess(result.orderId, quantity), mainMenu);

      clearState(userId);
      logger.transaction('purchase', userId, price, `Seguidores - ${service.name}`);
    }

  } catch (error) {
    logger.error('Erro no handler de mensagens', error);
    await sendMessage(msg.chat.id, messages.error());
  }
});

// ===== MONITORAR PAGAMENTO PIX =====

async function monitorPayment(userId, txid, chatId) {
  const maxAttempts = 60; // 30 minutos (verificando a cada 30s)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const result = await pix.checkPayment(txid);

      if (result.isPaid) {
        clearInterval(interval);

        const deposit = db.getPixDeposit(txid);

        if (deposit && deposit.status === 'pending') {
          // Adicionar saldo
          db.updateBalance(userId, deposit.amount, 'add');
          db.updatePixDepositStatus(txid, 'paid', new Date().toISOString());

          // Atualizar transação
          const transactions = db.getTransactions(userId, 50);
          const pendingTx = transactions.find(t => t.reference === txid && t.status === 'pending');
          if (pendingTx) {
            db.createTransaction(userId, 'deposit', deposit.amount, 'Depósito PIX confirmado', 'completed', txid);
          }

          const newBalance = db.getUserBalance(userId);

          await sendMessage(chatId, messages.depositConfirmed(deposit.amount, newBalance), mainMenu);

          logger.success('Pagamento confirmado', { userId, txid, amount: deposit.amount });
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        logger.warn('Monitoramento de pagamento expirado', { userId, txid });
      }

    } catch (error) {
      logger.error('Erro ao monitorar pagamento', { userId, txid, error: error.message });
    }

  }, 30000); // 30 segundos
}

// ===== CALLBACK QUERIES (Botões Inline) =====

bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    await bot.answerCallbackQuery(query.id);

    // ===== CANCELAR =====
    if (data === 'cancel') {
      clearState(userId);
      await sendMessage(chatId, '❌ Operação cancelada.', mainMenu);
      return;
    }

    // ===== VOLTAR =====
    if (data === 'back_main') {
      clearState(userId);
      await sendMessage(chatId, '🏠 Menu principal', mainMenu);
      return;
    }

    // ===== SMS - SELECIONAR SERVIÇO =====
    if (data.startsWith('sms_')) {
      const serviceCode = data.replace('sms_', '');
      const services = sms.getPopularServices();
      const service = services[serviceCode];

      if (!service) {
        return sendMessage(chatId, messages.error('Serviço não encontrado.'));
      }

      const balance = db.getUserBalance(userId);

      if (balance < service.price) {
        return sendMessage(chatId, messages.insufficientBalance(service.price, balance));
      }

      await sendMessage(chatId, `⏳ Comprando número ${service.name}...`);

      // Comprar número
      const result = await sms.buyNumber(serviceCode, 0);

      if (!result.success) {
        return sendMessage(chatId, messages.error(result.error));
      }

      // Debitar saldo
      db.updateBalance(userId, service.price, 'subtract');
      db.createTransaction(userId, 'purchase', -service.price, `SMS ${service.name}`, 'completed', result.activationId);
      db.createSmsOrder(userId, result.activationId, result.phoneNumber, serviceCode, result.country, service.price);

      await sendMessage(chatId, messages.smsWaiting(result.phoneNumber, service.name));

      // Monitorar SMS
      monitorSMS(userId, result.activationId, result.phoneNumber, chatId);

      logger.transaction('purchase', userId, service.price, `SMS ${service.name}`);
    }

    // ===== SEGUIDORES - SELECIONAR CATEGORIA =====
    if (data.startsWith('seg_')) {
      const category = data.replace('seg_', '');
      const categoryNames = {
        'instagram': 'Instagram',
        'tiktok': 'TikTok',
        'youtube': 'YouTube',
        'facebook': 'Facebook',
        'twitter': 'Twitter',
        'telegram': 'Telegram'
      };

      const categoryName = categoryNames[category];

      await sendMessage(chatId, '⏳ Buscando serviços disponíveis...');

      const result = await apex.getServicesByCategory(categoryName);

      if (!result.success || result.services.length === 0) {
        return sendMessage(chatId, messages.error(`Nenhum serviço disponível para ${categoryName}.`));
      }

      // Pegar primeiro serviço da categoria (mais popular)
      const service = result.services[0];

      setState(userId, 'awaiting_seguidores_link', { 
        service, 
        category: categoryName 
      });

      await sendMessage(chatId, messages.seguidoresLink(categoryName));
    }

  } catch (error) {
    logger.error('Erro no callback query', error);
    await sendMessage(chatId, messages.error());
  }
});

// ===== MONITORAR SMS =====

async function monitorSMS(userId, activationId, phoneNumber, chatId) {
  const maxAttempts = 40; // 20 minutos (verificando a cada 30s)
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const result = await sms.getStatus(activationId);

      if (result.status === 'received' && result.code) {
        clearInterval(interval);

        // Atualizar no banco
        db.updateSmsOrder(activationId, 'completed', result.code);

        await sendMessage(chatId, messages.smsReceived(phoneNumber, result.code), mainMenu);

        // Confirmar código
        await sms.confirmCode(activationId);

        logger.success('SMS recebido', { userId, activationId, code: result.code });
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);

        // Cancelar ativação
        await sms.cancelActivation(activationId);
        db.updateSmsOrder(activationId, 'cancelled');

        await sendMessage(chatId, '⏰ Tempo esgotado. O número foi cancelado e seu saldo será reembolsado.', mainMenu);

        logger.warn('SMS não recebido - timeout', { userId, activationId });
      }

    } catch (error) {
      logger.error('Erro ao monitorar SMS', { userId, activationId, error: error.message });
    }

  }, 30000); // 30 segundos
}

// ===== WEBHOOK =====

app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ===== ROTA DE SAÚDE =====

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: 'Telegram Bot PIX + SMS + Seguidores',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ===== INICIALIZAR SERVIDOR =====

async function start() {
  try {
    // Se houver WEBHOOK_URL, configurar webhook
    if (WEBHOOK_URL) {
      const webhookPath = `/webhook/${BOT_TOKEN}`;
      const fullWebhookUrl = `${WEBHOOK_URL}${webhookPath}`;

      await bot.setWebHook(fullWebhookUrl);
      logger.success('Webhook configurado', { url: fullWebhookUrl });

      app.listen(PORT, () => {
        logger.success('Bot iniciado com webhook', { port: PORT });
        console.log(`🤖 Bot rodando em modo webhook na porta ${PORT}`);
        console.log(`🌐 Webhook URL: ${fullWebhookUrl}`);
      });

    } else {
      // Modo polling (desenvolvimento local)
      await bot.deleteWebHook();
      bot.startPolling();

      logger.success('Bot iniciado com polling');
      console.log('🤖 Bot rodando em modo polling (desenvolvimento)');

      app.listen(PORT, () => {
        console.log(`🌐 Servidor rodando na porta ${PORT}`);
      });
    }

  } catch (error) {
    logger.error('Erro ao iniciar bot', error);
    console.error('❌ Erro ao iniciar:', error);
    process.exit(1);
  }
}

// ===== TRATAMENTO DE ERROS =====

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  console.error('Unhandled Rejection:', reason);
});

// ===== INICIAR =====

start();
