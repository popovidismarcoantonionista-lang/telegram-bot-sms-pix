const logger = require('../utils/logger');

// Margens por tier
const MARGINS = {
  economico: parseFloat(process.env.MARGIN_ECONOMICO) || 1.7,
  padrao: parseFloat(process.env.MARGIN_PADRAO) || 2.2,
  premium: parseFloat(process.env.MARGIN_PREMIUM) || 3.5
};

// Configuração de descontos
const DISCOUNTS = [
  {
    min: parseInt(process.env.DISCOUNT_TIER1_MIN) || 5,
    max: parseInt(process.env.DISCOUNT_TIER1_MAX) || 20,
    percent: parseFloat(process.env.DISCOUNT_TIER1_PERCENT) || 5
  },
  {
    min: parseInt(process.env.DISCOUNT_TIER2_MIN) || 21,
    max: parseInt(process.env.DISCOUNT_TIER2_MAX) || 100,
    percent: parseFloat(process.env.DISCOUNT_TIER2_PERCENT) || 12
  },
  {
    min: parseInt(process.env.DISCOUNT_TIER3_MIN) || 101,
    max: Infinity,
    percent: parseFloat(process.env.DISCOUNT_TIER3_PERCENT) || 20
  }
];

/**
 * Calcula o preço final baseado no custo, tier e quantidade
 */
function calculatePrice(baseCost, tier = 'padrao', quantity = 1) {
  try {
    const margin = MARGINS[tier.toLowerCase()] || MARGINS.padrao;

    // Calcular desconto baseado na quantidade
    let discount = 0;
    for (const tier of DISCOUNTS) {
      if (quantity >= tier.min && quantity <= tier.max) {
        discount = tier.percent;
        break;
      }
    }

    // Preço = (Custo Base) × Margem × (1 - Desconto)
    const price = baseCost * margin * (1 - discount / 100);

    logger.debug('Price calculated', {
      baseCost: baseCost,
      tier: tier,
      quantity: quantity,
      margin: margin,
      discount: discount,
      finalPrice: price
    });

    return parseFloat(price.toFixed(2));
  } catch (error) {
    logger.error('Error calculating price', { error: error.message });
    throw error;
  }
}

/**
 * Calcula quanto de crédito o usuário receberá
 */
function calculateCredits(amount, tier = 'padrao') {
  try {
    const margin = MARGINS[tier.toLowerCase()] || MARGINS.padrao;

    // Créditos = Valor Pago / Margem
    const credits = amount / margin;

    logger.debug('Credits calculated', {
      amount: amount,
      tier: tier,
      margin: margin,
      credits: credits
    });

    return parseFloat(credits.toFixed(2));
  } catch (error) {
    logger.error('Error calculating credits', { error: error.message });
    throw error;
  }
}

module.exports = {
  calculatePrice,
  calculateCredits,
  MARGINS,
  DISCOUNTS
};
