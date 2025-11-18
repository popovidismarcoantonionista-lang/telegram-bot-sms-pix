#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL não configurado no .env');
  console.log('\n💡 Para desenvolvimento local, deixe vazio e use polling.');
  process.exit(1);
}

async function setWebhook() {
  try {
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    const fullUrl = `${WEBHOOK_URL}${webhookPath}`;

    console.log('🔧 Configurando webhook...');
    console.log(`📡 URL: ${fullUrl}`);

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        url: fullUrl,
        allowed_updates: ['message', 'callback_query']
      }
    );

    if (response.data.ok) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('\n✨ Seu bot está pronto para receber mensagens!');
    } else {
      console.error('❌ Erro ao configurar webhook:', response.data);
    }

    // Verificar configuração
    const info = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );

    console.log('\n📊 Informações do Webhook:');
    console.log(JSON.stringify(info.data.result, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
    }
    process.exit(1);
  }
}

setWebhook();
