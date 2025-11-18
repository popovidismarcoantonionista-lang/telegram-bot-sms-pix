import axios from 'axios';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

class ApexSeguidores {
  constructor() {
    this.apiKey = process.env.APEX_API_KEY;
    this.baseURL = process.env.APEX_BASE_URL || 'https://apexseguidores.com/api/v2';
  }

  /**
   * Fazer requisição à API
   */
  async makeRequest(params = {}) {
    try {
      const response = await axios.post(this.baseURL, null, {
        params: {
          key: this.apiKey,
          ...params
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Erro na requisição Apex Seguidores', {
        params,
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
      const response = await this.makeRequest({ action: 'balance' });

      if (response.balance !== undefined) {
        return {
          success: true,
          balance: parseFloat(response.balance),
          currency: response.currency || 'BRL'
        };
      }

      return { success: false, error: 'Erro ao obter saldo' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar todos os serviços disponíveis
   */
  async getServices() {
    try {
      logger.info('Buscando serviços Apex');

      const response = await this.makeRequest({ action: 'services' });

      if (Array.isArray(response)) {
        const services = response.map(service => ({
          id: service.service,
          name: service.name,
          type: service.type,
          category: service.category,
          rate: parseFloat(service.rate),
          min: parseInt(service.min),
          max: parseInt(service.max)
        }));

        logger.success(`${services.length} serviços encontrados`);

        return { success: true, services };
      }

      return { success: false, error: 'Nenhum serviço disponível' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar serviços por categoria
   */
  async getServicesByCategory(category = 'Instagram') {
    try {
      const result = await this.getServices();

      if (result.success) {
        const filtered = result.services.filter(s => 
          s.category && s.category.toLowerCase().includes(category.toLowerCase())
        );

        return { success: true, services: filtered };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Criar novo pedido
   * @param {string} serviceId - ID do serviço
   * @param {string} link - Link do perfil/post
   * @param {number} quantity - Quantidade
   */
  async createOrder(serviceId, link, quantity) {
    try {
      logger.info('Criando pedido Apex', { serviceId, link, quantity });

      const response = await this.makeRequest({
        action: 'add',
        service: serviceId,
        link,
        quantity
      });

      if (response.order) {
        logger.success('Pedido Apex criado', { orderId: response.order });

        return {
          success: true,
          orderId: response.order
        };
      }

      return {
        success: false,
        error: response.error || 'Erro ao criar pedido'
      };

    } catch (error) {
      logger.error('Erro ao criar pedido Apex', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar status do pedido
   * @param {string} orderId - ID do pedido
   */
  async getOrderStatus(orderId) {
    try {
      const response = await this.makeRequest({
        action: 'status',
        order: orderId
      });

      if (response.status !== undefined) {
        return {
          success: true,
          status: response.status,
          charge: parseFloat(response.charge || 0),
          startCount: parseInt(response.start_count || 0),
          remains: parseInt(response.remains || 0)
        };
      }

      return { success: false, error: 'Pedido não encontrado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular preço do pedido
   * @param {number} rate - Taxa por 1000
   * @param {number} quantity - Quantidade desejada
   */
  calculatePrice(rate, quantity) {
    return (rate * quantity) / 1000;
  }

  /**
   * Categorias populares
   */
  getPopularCategories() {
    return [
      'Instagram',
      'TikTok',
      'YouTube',
      'Facebook',
      'Twitter',
      'Telegram',
      'Spotify',
      'Twitch'
    ];
  }

  /**
   * Status traduzidos
   */
  translateStatus(status) {
    const statusMap = {
      'Pending': '⏳ Pendente',
      'In progress': '⚙️ Em andamento',
      'Completed': '✅ Concluído',
      'Partial': '⚠️ Parcial',
      'Processing': '🔄 Processando',
      'Canceled': '❌ Cancelado'
    };

    return statusMap[status] || status;
  }

  /**
   * Formatar valor
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export default new ApexSeguidores();
