function welcomeMessage(user) {
  return `
🎉 *Bem-vindo(a) ao Bot de Créditos SMS!*

Olá, ${user.username}!

💰 *Seu saldo atual:* R$ ${user.balance.toFixed(2)}

🔹 *Funcionalidades:*
• 💰 Comprar créditos via PIX
• 📱 Alugar números SMS descartáveis
• 👥 Comprar seguidores

📋 *Comandos disponíveis:*
/comprar_creditos - Adicionar créditos
/comprar_sms - Alugar número SMS
/comprar_seguidores - Comprar seguidores
/saldo - Ver seu saldo
/historico - Ver histórico de transações
/ajuda - Menu de ajuda

🎁 *Descontos progressivos disponíveis!*
  `;
}

module.exports = {
  welcomeMessage
};
