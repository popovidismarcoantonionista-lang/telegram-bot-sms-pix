const creditPackagesKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🥉 Econômico (×1.7)', callback_data: 'package:economico' }],
      [{ text: '🥈 Padrão (×2.2)', callback_data: 'package:padrao' }],
      [{ text: '🥇 Premium (×3.5)', callback_data: 'package:premium' }]
    ]
  }
};

module.exports = {
  creditPackagesKeyboard
};
