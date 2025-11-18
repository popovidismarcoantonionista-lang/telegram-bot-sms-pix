import axios from 'axios';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

class SMSActivate {
  constructor() {
    this.apiKey = process.env.SMS_ACTIVATE_API_KEY;
    this.baseURL = process.env.SMS_ACTIVATE_BASE_URL || 'https://api.sms-activate.org/stubs/handler_api.php';
  }

  /**
   * Fazer requisição à API
   */
  async makeRequest(action, params = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          api_key: this.apiKey,
          action,
          ...params
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Erro na requisição SMS-Activate', {
        action,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Obter saldo da conta
   */
  async getBalance() {
    try {
      const response = await this.makeRequest('getBalance');

      if (response.startsWith('ACCESS_BALANCE:')) {
        const balance = parseFloat(response.split(':')[1]);
        return { success: true, balance };
      }

      return { success: false, error: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar serviços disponíveis
   */
  async getServices(country = 0) {
    try {
      const response = await this.makeRequest('getNumbersStatus', { country });

      if (typeof response === 'object') {
        const services = Object.entries(response).map(([key, value]) => ({
          service: key,
          available: value !== 0,
          count: value
        })).filter(s => s.available);

        return { success: true, services };
      }

      return { success: false, error: 'Nenhum serviço disponível' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter preços por serviço
   */
  async getPrices(service = '', country = 0) {
    try {
      const response = await this.makeRequest('getPrices', { service, country });

      if (typeof response === 'object') {
        return { success: true, prices: response };
      }

      return { success: false, error: 'Erro ao obter preços' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Comprar número para receber SMS
   * @param {string} service - Código do serviço (ex: 'wa' para WhatsApp)
   * @param {number} country - Código do país (0 = Rússia, 1 = Ucrânia, etc)
   */
  async buyNumber(service = 'go', country = 0) {
    try {
      logger.info('Comprando número SMS', { service, country });

      const response = await this.makeRequest('getNumber', { service, country });

      if (response.startsWith('ACCESS_NUMBER:')) {
        const [_, activationId, phoneNumber] = response.split(':');

        logger.success('Número SMS comprado', { activationId, phoneNumber });

        return {
          success: true,
          activationId,
          phoneNumber: '+' + phoneNumber,
          service,
          country
        };
      }

      // Tratamento de erros comuns
      const errorMessages = {
        'NO_NUMBERS': 'Não há números disponíveis para este serviço',
        'NO_BALANCE': 'Saldo insuficiente na conta SMS-Activate',
        'BAD_SERVICE': 'Serviço inválido',
        'BAD_ACTION': 'Ação inválida'
      };

      return {
        success: false,
        error: errorMessages[response] || response
      };

    } catch (error) {
      logger.error('Erro ao comprar número SMS', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar status e obter código SMS
   * @param {string} activationId - ID da ativação
   */
  async getStatus(activationId) {
    try {
      const response = await this.makeRequest('getStatus', { id: activationId });

      // STATUS_WAIT_CODE = aguardando SMS
      if (response === 'STATUS_WAIT_CODE') {
        return {
          success: true,
          status: 'waiting',
          message: 'Aguardando SMS...'
        };
      }

      // STATUS_OK:CODE = SMS recebido
      if (response.startsWith('STATUS_OK:')) {
        const code = response.split(':')[1];

        logger.success('Código SMS recebido', { activationId, code });

        return {
          success: true,
          status: 'received',
          code
        };
      }

      // STATUS_CANCEL = cancelado
      if (response === 'STATUS_CANCEL') {
        return {
          success: false,
          status: 'cancelled',
          error: 'Ativação cancelada'
        };
      }

      return {
        success: false,
        status: 'unknown',
        error: response
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar ativação
   * @param {string} activationId - ID da ativação
   */
  async cancelActivation(activationId) {
    try {
      const response = await this.makeRequest('setStatus', {
        id: activationId,
        status: 8 // 8 = cancelar
      });

      if (response === 'ACCESS_CANCEL') {
        logger.info('Ativação cancelada', { activationId });
        return { success: true };
      }

      return { success: false, error: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirmar recebimento do código
   * @param {string} activationId - ID da ativação
   */
  async confirmCode(activationId) {
    try {
      const response = await this.makeRequest('setStatus', {
        id: activationId,
        status: 6 // 6 = confirmar
      });

      if (response === 'ACCESS_ACTIVATION') {
        return { success: true };
      }

      return { success: false, error: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Serviços populares no Brasil
   */
  getPopularServices() {
    return {
      'wa': { name: 'WhatsApp', price: 8.00 },
      'tg': { name: 'Telegram', price: 5.00 },
      'go': { name: 'Google', price: 4.00 },
      'fb': { name: 'Facebook', price: 6.00 },
      'ig': { name: 'Instagram', price: 7.00 },
      'tw': { name: 'Twitter/X', price: 5.00 },
      'vk': { name: 'VK', price: 3.00 },
      'ok': { name: 'OK', price: 3.00 },
      'ot': { name: 'Outros', price: 4.00 }
    };
  }
}

export default new SMSActivate();
