import axios from 'axios';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

class PixIntegra {
  constructor() {
    this.apiKey = process.env.PIX_API_KEY;
    this.apiToken = process.env.PIX_API_TOKEN;
    this.baseURL = process.env.PIX_BASE_URL || 'https://api.pixintegra.com.br';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Gerar cobrança PIX
   * @param {number} amount - Valor em reais
   * @param {string} description - Descrição da cobrança
   * @returns {Promise<Object>} - Dados da cobrança (txid, qrcode, qrcode_image)
   */
  async createCharge(amount, description = 'Depósito') {
    try {
      logger.info('Criando cobrança PIX', { amount, description });

      const payload = {
        valor: amount.toFixed(2),
        descricao: description,
        txid: this.generateTxid()
      };

      const response = await this.client.post('/v1/pix/cobranca', payload);

      if (response.data && response.data.success) {
        const { txid, qrcode, qrcode_image } = response.data.data;

        logger.success('Cobrança PIX criada', { txid, amount });

        return {
          success: true,
          txid,
          qrCode: qrcode,
          qrCodeImage: qrcode_image,
          amount
        };
      }

      throw new Error('Resposta inválida da API PIX');

    } catch (error) {
      logger.error('Erro ao criar cobrança PIX', {
        message: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar status de pagamento
   * @param {string} txid - ID da transação
   * @returns {Promise<Object>} - Status do pagamento
   */
  async checkPayment(txid) {
    try {
      const response = await this.client.get(`/v1/pix/cobranca/${txid}`);

      if (response.data && response.data.success) {
        const { status, valor_pago, data_pagamento } = response.data.data;

        return {
          success: true,
          status,
          paidAmount: parseFloat(valor_pago || 0),
          paidAt: data_pagamento,
          isPaid: status === 'CONCLUIDA' || status === 'paid'
        };
      }

      return {
        success: false,
        error: 'Falha ao verificar pagamento'
      };

    } catch (error) {
      logger.error('Erro ao verificar pagamento', {
        txid,
        message: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar TXID único
   */
  generateTxid() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}${random}`.substring(0, 32);
  }

  /**
   * Formatar valor para exibição
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export default new PixIntegra();
