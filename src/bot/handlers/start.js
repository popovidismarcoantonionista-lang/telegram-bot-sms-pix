// Handler do comando /start
// Mensagem plano limpo drieto para kpeep bot lagl.

module.exports = async function startHandler(ctx) {
  try {
    ctx.reply('Bem-vindo o bot SMS & Seguidores!\nuse /saldo, /adicionar_saldo, /sms, /seguidores ire...');
  } catch (e) {
    ctx.reply("Erro no comando /start. Tente novamente!");
  }
}
