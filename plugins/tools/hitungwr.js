module.exports = {
  name: 'hitungwr',
  command: ['hitungwr', 'wr', 'cekwr'],
  aliases: ['wr', 'cekwr'],
  category: 'tools',
  tags: ['tools'],
  help: ['hitungwr', 'wr'],
  description: 'Kalkulator Winrate (WR) Mobile Legends & Game Kompetitif (.wr <match> <wr_skrg> <target_wr>)',
  async execute(ctx) {
    const args = ctx.args || [];
    if (args.length < 3) {
      return ctx.reply(
        `📊 *KALKULATOR WINRATE (WR)*\n\n` +
        `Cara pakai:\n` +
        `*.hitungwr <TotalMatch> <WRSekarang> <TargetWR>*\n\n` +
        `Contoh:\n` +
        `*.hitungwr 350 54 60*`
      );
    }

    const totalMatch = parseFloat(args[0]);
    const currentWr = parseFloat(args[1]);
    const targetWr = parseFloat(args[2]);

    if (
      isNaN(totalMatch) ||
      isNaN(currentWr) ||
      isNaN(targetWr) ||
      totalMatch <= 0 ||
      currentWr < 0 ||
      currentWr > 100 ||
      targetWr <= currentWr ||
      targetWr >= 100
    ) {
      return ctx.reply('⚠️ Masukkan angka yang valid! Target WR harus lebih besar dari WR sekarang dan di bawah 100%.');
    }

    const currentWins = totalMatch * (currentWr / 100);
    const neededWins = Math.ceil((targetWr * totalMatch - 100 * currentWins) / (100 - targetWr));

    return ctx.reply(
      `🏆 *HASIL KALKULATOR WINRATE* 🏆\n\n` +
      `🎮 Total Match Saat Ini: *${totalMatch} Match*\n` +
      `📈 WR Saat Ini: *${currentWr}%*\n` +
      `🎯 Target WR: *${targetWr}%*\n\n` +
      `🔥 Kamu membutuhkan *+${neededWins} Win Beruntun (Tanpa Lose)* untuk mencapai Winrate *${targetWr}%*!`
    );
  }
};
module.exports.handler = module.exports.execute;
