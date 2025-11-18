export const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: '💰 Depositar' }, { text: '💳 Saldo' }],
      [{ text: '📱 SMS Descartável' }, { text: '👥 Seguidores' }],
      [{ text: '📊 Histórico' }, { text: '💬 Suporte' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

export const smsMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📱 WhatsApp', callback_data: 'sms_wa' },
        { text: '✈️ Telegram', callback_data: 'sms_tg' }
      ],
      [
        { text: '🔍 Google', callback_data: 'sms_go' },
        { text: '📘 Facebook', callback_data: 'sms_fb' }
      ],
      [
        { text: '📸 Instagram', callback_data: 'sms_ig' },
        { text: '🐦 Twitter/X', callback_data: 'sms_tw' }
      ],
      [
        { text: '🔙 Voltar', callback_data: 'back_main' }
      ]
    ]
  }
};

export const seguidoresMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📸 Instagram', callback_data: 'seg_instagram' },
        { text: '🎵 TikTok', callback_data: 'seg_tiktok' }
      ],
      [
        { text: '▶️ YouTube', callback_data: 'seg_youtube' },
        { text: '📘 Facebook', callback_data: 'seg_facebook' }
      ],
      [
        { text: '🐦 Twitter', callback_data: 'seg_twitter' },
        { text: '✈️ Telegram', callback_data: 'seg_telegram' }
      ],
      [
        { text: '🔙 Voltar', callback_data: 'back_main' }
      ]
    ]
  }
};

export const cancelMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '❌ Cancelar', callback_data: 'cancel' }]
    ]
  }
};

export const formatBalance = (balance) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(balance);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const escapeMarkdown = (text) => {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

export const messages = {
  welcome: (name) => `
🎉 *Bem-vindo ao Bot, ${name}!*

Seu cadastro foi realizado com sucesso!

💰 *Saldo inicial:* R$ 0,00

*Serviços disponíveis:*
📱 SMS Descartável - Números virtuais
👥 Seguidores - Instagram, TikTok, YouTube e mais

*Como usar:*
1️⃣ Faça um depósito via PIX
2️⃣ Escolha o serviço desejado
3️⃣ Pronto! É rápido e automático

Use o menu abaixo para começar! 👇
  `.trim(),

  balance: (balance, userId) => `
💳 *Seu Saldo Atual*

💰 Saldo disponível: *${formatBalance(balance)}*
🆔 ID: \`${userId}\`

Para adicionar saldo, use o botão *Depositar* 💰
  `.trim(),

  deposit: (minDeposit) => `
💰 *Depósito via PIX*

Digite o valor que deseja depositar:

📌 *Valor mínimo:* ${formatBalance(minDeposit)}
📌 *Exemplo:* 10 ou 10.50

Aguardando seu valor...
  `.trim(),

  depositCreated: (amount, qrCode) => `
✅ *Cobrança PIX Gerada!*

💵 Valor: *${formatBalance(amount)}*

*Pix Copia e Cola:*
\`${qrCode}\`

⏰ Esta cobrança expira em *30 minutos*

Após o pagamento, seu saldo será atualizado automaticamente! 🚀
  `.trim(),

  depositConfirmed: (amount, newBalance) => `
✅ *Pagamento Confirmado!*

💰 Valor recebido: *${formatBalance(amount)}*
💳 Novo saldo: *${formatBalance(newBalance)}*

Obrigado pelo depósito! 🎉
  `.trim(),

  insufficientBalance: (required, current) => `
❌ *Saldo Insuficiente*

💰 Valor necessário: *${formatBalance(required)}*
💳 Seu saldo atual: *${formatBalance(current)}*

Faça um depósito para continuar! 💰
  `.trim(),

  smsServices: `
📱 *SMS Descartável*

Escolha o serviço para receber SMS:

💵 *Preços:*
• WhatsApp - R$ 8,00
• Telegram - R$ 5,00
• Google - R$ 4,00
• Facebook - R$ 6,00
• Instagram - R$ 7,00
• Twitter/X - R$ 5,00

⚠️ O número ficará disponível por 20 minutos
  `.trim(),

  smsWaiting: (phone, service) => `
✅ *Número Adquirido!*

📱 Número: \`${phone}\`
🎯 Serviço: *${service}*

⏰ Aguardando SMS... (até 20 minutos)

Use este número para fazer seu cadastro. Assim que o SMS chegar, você receberá o código aqui! 📨
  `.trim(),

  smsReceived: (phone, code) => `
✅ *SMS Recebido!*

📱 Número: \`${phone}\`
🔐 Código: *${code}*

Use este código para completar seu cadastro! ✨
  `.trim(),

  seguidoresCategories: `
👥 *Comprar Seguidores*

Escolha a plataforma:

📸 Instagram
🎵 TikTok  
▶️ YouTube
📘 Facebook
🐦 Twitter
✈️ Telegram

Selecione abaixo 👇
  `.trim(),

  seguidoresLink: (platform) => `
🔗 *Envie o Link*

Envie o link completo do seu perfil/post no *${platform}*

📌 *Exemplo:*
https://instagram.com/seuperfil
https://tiktok.com/@seuperfil

Aguardando o link...
  `.trim(),

  seguidoresQuantity: (service) => `
🔢 *Quantidade*

📊 Serviço: ${service.name}
💰 Preço: R$ ${service.rate.toFixed(2)} por 1000

📌 Mínimo: ${service.min}
📌 Máximo: ${service.max.toLocaleString('pt-BR')}

Digite a quantidade desejada:
  `.trim(),

  seguidoresConfirm: (service, quantity, price) => `
✅ *Confirmar Pedido*

📊 Serviço: ${service}
🔢 Quantidade: ${quantity.toLocaleString('pt-BR')}
💰 Valor: *${formatBalance(price)}*

Confirme para processar o pedido.
  `.trim(),

  seguidoresSuccess: (orderId, quantity) => `
✅ *Pedido Criado com Sucesso!*

🆔 ID do Pedido: \`${orderId}\`
🔢 Quantidade: ${quantity.toLocaleString('pt-BR')}

⚙️ Status: *Em processamento*

Seu pedido será processado em breve! ⏱️
  `.trim(),

  history: (transactions) => {
    if (!transactions || transactions.length === 0) {
      return '📊 *Histórico de Transações*\n\nNenhuma transação encontrada.';
    }

    let text = '📊 *Histórico de Transações*\n\n';

    transactions.forEach((t, i) => {
      const icon = t.type === 'deposit' ? '💰' : t.type === 'purchase' ? '🛒' : '📝';
      text += `${icon} *${t.description}*\n`;
      text += `   Valor: ${formatBalance(Math.abs(t.amount))}\n`;
      text += `   ${formatDate(t.created_at)}\n\n`;
    });

    return text.trim();
  },

  support: `
💬 *Suporte*

Precisa de ajuda? Entre em contato:

📧 Email: suporte@seubot.com
✈️ Telegram: @seusuporte

⏰ Atendimento: 24/7

Respondemos em até 24 horas! 💙
  `.trim(),

  error: (message) => `
❌ *Erro*

${message || 'Ocorreu um erro. Tente novamente.'}
  `.trim()
};
