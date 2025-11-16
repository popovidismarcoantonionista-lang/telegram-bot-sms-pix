const axios = require('axios');
const logger = require('../utils/logger');

const SMS_BASE_URL = process.env.SMS_ACTIVATE_BASE_URL || 'https://api.sms-activate.org/stsz';
const SMS_API_KEY = process.env.SMS_ACTIVATE_API_KEY;

const smsClient = axios.create({
  baseURL: SMS_BASE_URL,
  timeout: 30000
});

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
    logger.error('Error getting balance', { error: error.message });
    throw error;
  }
}

async function getNumber(country, service) {
  try {
    const response = await smsClient.get('/getNumber.php', {
      params: { api_key: SMS_API_KEY, service, country }
    });

    if (typeof response.data === 'string' && response.data.startsWith('ACCESS_NUMBER')) {
      const parts = response.data.split(':');
      return {
        activation_id: parts[1],
        phone: parts[2],
        country,
        service,
        status: 'waiting'
      };
    }

    if (response.data === 'NO_NUMBERS') {
      throw new Error('Nenhum número disponível no momento');
    }
    throw new Error(`Erro ao comprar número: ${response.data}`);
  } catch (error) {
    logger.error('Error getting SMS number', { error: error.message });
    throw error;
  }
}

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
    logger.error('Error getting status', { error: error.message });
    throw error;
  }
}

async function cancelActivation(activationId) {
  try {
    await smsClient.get('/setStatus.php', {
      params: { api_key: SMS_API_KEY, id: activationId, status: 8 }
    });
    logger.info('SMS cancelled', { activationId });
    return true;
  } catch (error) {
    logger.error('Error cancelling', { error: error.message });
    throw error;
  }
}

module.exports = {
  getBalance,
  getNumber,
  getStatus,
  cancelActivation
};