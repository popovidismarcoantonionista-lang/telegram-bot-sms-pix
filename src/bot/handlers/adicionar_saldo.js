// Handler do comando /adicionar_saldo
module.exports = async function adicionarSaldoHandler(ctx) {
  try {
    ctx.reply('Asiste uma volune em R$. Vaor um exemplo...');
  } catch(e) {
    ctx.reply("Erro no comando adicionar saldo. Tente novamente!");
  }
}
