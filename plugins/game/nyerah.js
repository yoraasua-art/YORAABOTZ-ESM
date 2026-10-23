const { isGuessGame, revealAnswer } = require('../../lib/game-engine');

module.exports = {
  name: 'nyerah',
  category: 'game',
  aliases: ['menyerah', 'giveup'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, gameState, clearGameTimeout } = ctx;
    const g = gameState[from];
    if (!isGuessGame(g)) {
      return sock.sendMessage(from, { text: '❌ Tidak ada game tebak-tebakan yang aktif.' }, { quoted: msg });
    }
    const owner = typeof ctx.isSenderOwner === 'function' && ctx.isSenderOwner();
    if (g.sender && g.sender !== sender && !owner) {
      return sock.sendMessage(from, { text: '❌ Hanya yang memulai soal ini yang boleh menyerah. Yang lain silakan rebutan jawabannya!' }, { quoted: msg });
    }
    clearGameTimeout(from);
    delete gameState[from];

    const detail = g.multi
      ? `Jawaban yang belum ketemu:\n${g.jawab.filter((_, i) => !g.found?.[i]).map(a => `• ${a}`).join('\n') || '-'}`
      : `Jawaban yang benar: *${revealAnswer(g)}*`;
    await sock.sendMessage(from, {
      text: `🏳️ *NYERAH!*\n\n${detail}\n\n_Jangan menyerah ya!_`,
    }, { quoted: msg });
  }
};
