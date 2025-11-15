require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Telegram Bot SMS_PIX',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Webhook endpoints (placeholders)
app.post('/webhook/telegram', (req, res) => {
  console.log('Telegram webhook received:', req.body);
  res.status(200).json({ ok: true });
});

app.post('/webhook/pixintegra', (req, res) => {
  console.log('PixIntegra webhook received:', req.body);
  res.status(200).json({ ok: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤔 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'Configurado ✒' : 'FALTANDO ✗'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Configurado ✓' : 'FALTANDO ✗'}`);
});

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
