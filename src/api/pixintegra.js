const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const PIX_BASE_URL = process.env.PIXINTEGRA_BASE_URL || 'https://api.pixintegra.com';
const PIX_API_TOKEN = process.env.PIXINTEGRA_API_TOKEN;
const PIX_WEBHOOK_SECRET = process.env.PIXINTEGRA_WEBHOOK_SECRET;

const pixClient = axios.create({
  baseURL: PIX_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PIX_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Cria uma cobrança PIX
 */
async function createCharge({ userId, amount, description, externalId }) {
  try {
    const response = await pixClient.post('/v1/charges', {
      value: amount,
      description: description || 'Compra de créditos',
      external_id: externalId || `order_${userId}_${Date.now()}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      customer: {
        external_id: userId.toString()
      }
    });

    const charge = response.data;

    logger.info('PixIntegra charge created', {
      chargeId: charge.id,
      userId: userId,
      amount: amount
    });

    return {
      id: charge.id,
      status: charge.status,
      value: charge.value,
      qr_code: charge.qr_code, 
      qr_code_text: charge.qr_code_text, // Copia e cola
      qr_code_image: charge.qr_code_image, // Imagem do QR Code
      expires_at: charge.expires_at,
      external_id: charge.external_id
    };
  } catch (error) {
    logger.error('Error creating PixIntegra charge', {
      userId: userId,
      amount: amount,
      error: error.message,
      response: error.response?.data
    });
    throw new Error('Falha ao criar cobrança PIX');
  }
}

/**
 * Consulta o status de uma cobrança
 */
async function getCharge(chargeId) {
  try {
    const response = await pixClient.get(`/v1/charges/${chargeId}`);
    
    return {
      id: response.data.id,
      status: response.data.status, // pending, paid, cancelled, expired
      value: response.data.value,
      paid_at: response.data.paid_at,
      external_id: response.data.external_id
    };
  } catch (error) {
    logger.error('Error getting PixIntegra charge', {
      chargeId: chargeId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Cancela uma cobrança
 */
async function cancelCharge(chargeId) {
  try {
    await pixClient.delete(`/v1/charges/${chargeId}`);
    
    logger.info('PixIntegra charge cancelled', { chargeId: chargeId });
    return true;
  } catch (error) {
    logger.error('Error cancelling PixIntegra charge', {
      chargeId: chargeId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Valida signatura HMAC do webhook
 */
function validateWebhookSignature(payload, signature) {
  const hash = crypto
    .createHmac('sha256', PIX_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
}

/**
 * Lista cobranças com filtros
 */
async function listCharges({ limit = 20, offset = 0, status } = {}) {
  try {
    const params = { limit, offset };
    if (status) params.status = status;

    const response = await pixClient.get('/v1/charges', { params });
    
    return {
      data: response.data.data,
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset
    };
  } catch (error) {
    logger.error('Error listing PixIntegra charges', {
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  createCharge,
  getCharge,
  cancelCharge,
  listCharges,
  validateWebhookSignature
};
