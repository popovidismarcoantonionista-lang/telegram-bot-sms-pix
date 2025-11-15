require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importar módulos do bot
const { initializeBot } = require('./src/bot/handlers/start');
const { setupWebhook } = require('./src/webhooks/telegram');
const { setupPixIntegraWebhook } = require('./src/webhooks/pixintegra');
const { initDatabase } = require('./src/database/models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Telegram Bot SMS/PIX',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Inicialização
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');

    // Inicializar banco de dados
    await initDatabase();
    console.log('✅ Banco de dados inicializado');

    // Configurar webhooks
    setupWebhook(app);
    setupPixIntegraWebhook(app);
    console.log('✅ Webhooks configurados');

    // Inicializar bot
    await initializeBot();
    console.log('✅ Bot Telegram inicializado');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar
startServer();
