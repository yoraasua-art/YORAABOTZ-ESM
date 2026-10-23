module.exports = {
  name: 'tebakangka', category: 'game', startsGame: true,
  async execute(sock, msg, args, ctx) {
    const { config, from, sender, gameState, setGameTimeout } = ctx;
    const hard = ['sulit', 'hard', '100'].includes((args[0] || '').toLowerCase());
    const max = hard ? 100 : 10;
    const angka = Math.floor(Math.random() * max) + 1;
    const reward = hard ? [10, 1500] : [5, 500];
    gameState[from] = { game: 'tebakangka', angka, sender, max, reward };
    setGameTimeout(from, async () => {
      await sock.sendMessage(from, { text: `⏰ *WAKTU HABIS!*\n\nJawaban: *${angka}*` });
    });
    await sock.sendMessage(from, {
      text: `🔢 *TEBAK ANGKA${hard ? ' (SULIT)' : ''}*\n\nBot pilih 1-${max}.${hard ? '\nBot akan memberi petunjuk *lebih besar/lebih kecil*.' : `\nMau lebih menantang? *${config.prefix}tebakangka sulit* (1-100)`}\n\n💬 *Ketik angkamu langsung di chat!*\n🏳️ Ketik *nyerah* untuk skip\n\n⏱️ ${ctx.gameDurationText || '2 menit'} | +${reward[0]} Point, +Rp ${reward[1].toLocaleString('id-ID')}`
    });
  }
};