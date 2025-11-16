// Handler do comando /seguidores

const message = "Para comprar seguidores, digite o usuario da rede em baixo.";
module.exports = async function seguidoresHandler(ctx) {
  try {
    ctx.reply(message);
  } catch(e) {
    ctx.reply("Erro no comando Seguidores. Tente novamente!");
  }
}
