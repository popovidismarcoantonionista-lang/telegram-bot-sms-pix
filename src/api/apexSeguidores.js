const axios = require('axios');
const logger = require('../utils/logger');

const APEX_BASE_URL = process.env.APEX_BASE_URL;
const APEX_API_KEY = process.env.APEX_API_KEY;
const APEX_AUTH_METHOD = process.env.APEX_AUTH_METHOD || 'Bearer';

const apexClient = axios.create({
  baseURL: APEX_BASE_URL,
  headers: {
    'Authorization': `${APEX_AUTH_METHOD} ${APEX_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

/**
 * Cria um pedido de seguidores
 */
async function createOrder({ platform, quantity, url }) {
  try {
    const createPath = process.env.APEX_CREATE_ORDER_PATH || '/api/v1/orders';

    const response = await apexClient.post(createPath, {
      platform: platform,
      quantity: quantity,
      target_url: url,
      speed: 'normal' // slow, normal, fast
    });

    logger.info('Apex order created', {
      orderId: response.data.order_id,
      platform: platform,
      quantity: quantity
    });

    return {
      order_id: response.data.order_id,
      status: response.data.status,
      estimated_delivery: response.data.estimated_delivery
    };
  } catch (error) {
    logger.error('Error creating Apex order', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error('Falha ao criar pedido de seguidores');
  }
}

/**
 * Consulta status de um pedido
 */
async function getOrderStatus(orderId) {
  try {
    const statusPath = (process.env.APEX_CHECK_STATUS_PATH || '/api/v1/orders/{order_id}')
      .replace('{order_id}', orderId);

    const response = await apexClient.get(statusPath);

    return {
      order_id: response.data.order_id,
      status: response.data.status,
      delivered: response.data.delivered,
      remaining: response.data.remaining
    };
  } catch (error) {
    logger.error('Error getting Apex order status', {
      orderId: orderId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Cancela um pedido
 */
async function cancelOrder(orderId) {
  try {
    const cancelPath = (process.env.APEX_CANCEL_PATH || '/api/v1/orders/{order_id}/cancel')
      .replace('{order_id}', orderId);

    await apexClient.post(cancelPath);

    logger.info('Apex order cancelled', { orderId: orderId });
  } catch (error) {
    logger.error('Error cancelling Apex order', {
      orderId: orderId,
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  createOrder,
  getOrderStatus,
  cancelOrder
};
