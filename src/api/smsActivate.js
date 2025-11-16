const axios = require('axios');
const logger = require('../utils/logger');

const SMS_BASE_URL = process.env.SMS_ACTIVATE_BASE_URL || 'https://api.sms-activate.org/stsz';
const SMS_API_KEY = process.env.SMS_ACTIVATE_API_KEY;

const smsClient = axios.create({
  baseURL: SMS_BASE_URL,
  timeout: 30000
});

/**
 * Obtém saldo da conta
 */
async function getBalance() {
  try {
    const response = await smsClient.get('/getBalance.php', {
      params: { api_key: SMS_API_KEY }
    });

    if (response.data.startsWith('ACCESS_NUMBER')) {
      const balance = parseFloat(response.data.split(':')[1]);
      logger.info('SMS-Activate balance checked', { balance });
      return balance;
    }
    throw new Error('Invalid API response');
  } catch (error) {
    logger.error('Error getting SMS-Activate balance', { error: error.message });
    throw error;
  }
}

/**
 * Obtém preço de um serviço em um país
 */
async function getPrice(country, service) {
  try {
    const response = await smsClient.get('/getPrices.php', {
      params: { api_key: SMS_API_KEY, service, country }
    });

    if (typeof response.data === 'object') {
      return {
        country,
        service,
        cost: parseFloat(response.data[country]?.[service]?.cost || 0),
        count: response.data[country]?.[service]?.count || 0
      };
    }
    throw new Error('Invalid price response');
  } catch (error) {
    logger.error('Error getting SMS price', { country, service, error: error.message });
    throw error;
  }
}

/**
 * Compra um número de SMS
 */
async function getNumber(country, service) {
  try {
    const response = await smsClient.get('/getNumber.php', {
      params: { api_key: SMS_API_KEY, service, country }
    });

    if (typeof response.data === 'string' && response.data.startsWith('ACCESS_NUMBER')) {
      const parts = response.data.split(':');
      const result = {
        activation_id: parts[1],
        phone: parts[2],
        country,
        service,
        status: 'waiting'
      };

      logger.info('SMS number acquired', {
        activationId: result.activation_id,
        phone: result.phone
      });

      return result;
    }

    if (response.data === 'NO_NUMBERS') {
      throw new Error('Nenhum número disponível no momento');
    }
    if (response.data === 'BAD_KEY') {
      throw new Error('Chave API inválida');
    }
    throw new Error(`Erro ao comprar número: ${response.data}`);
  } catch (error) {
    logger.error('Error getting SMS number', {
      country,
      service,
      error: error.message
    });
    throw error;
  }
}

/**
 * Verifica o status e obtém o código SMS
 */
async function getStatus(activationId) {
  try {
    const response = await smsClient.get('/getStatus.php', {
      params: { api_key: SMS_API_KEY, id: activationId }
    });

    if (typeof response.data === 'string') {
      if (response.data.startsWith('STATUS_OK')) {
        const code = response.data.split(':')[1];
        logger.info('SMS code received', { activationId, code });
        return { status: 'completed', code };
      }
      if (response.data === 'STATUS_WAIT_CODE') {
        return { status: 'waiting', code: null };
      }
      if (response.data === 'STATUS_CANCEL') {
        return { status: 'cancelled', code: null };
      }
    }
    return { status: 'unknown', code: null };
  } catch (error) {
    logger.error('Error getting SMS status', {
      activationId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Define status da ativação
 */
async function setStatus(activationId, status) {
  try {
    const response = await smsClient.get('/setStatus.php', {
      params: { api_key: SMS_API_KEY, id: activationId, status }
    });

    logger.info('SMS status updated', { activationId, status });
    return response.data === 'ACCESS_ACTIVATION';
  } catch (error) {
    logger.error('Error setting SMS status', {
      activationId,
      status,
      error: error.message
    });
    throw error;
  }
}

/**
 * Cancela uma ativação
 */
async function cancelActivation(activationId) {
  return setStatus(activationId, 8);
}

/**
 * Confirma recebimento do código
 */
async function confirmSMS(activationId) {
  return setStatus(activationId, 6);
}

module.exports = {
  getBalance,
  getPrice,
  getNumber,
  getStatus,
  setStatus,
  cancelActivation,
  confirmSMS
};
