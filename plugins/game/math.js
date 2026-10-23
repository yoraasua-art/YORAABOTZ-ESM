const { generateStoryProblem, LEVEL_REWARD } = require('../../lib/math-story');

const LEVEL_ALIASES = { mudah: 'mudah', gampang: 'mudah', easy: 'mudah', sedang: 'sedang', medium: 'sedang', sulit: 'sulit', susah: 'sulit', hard: 'sulit' };

module.exports = {
  name: 'math',
  category: 'game',
  startsGame: true,
  aliases: ['matematika', 'soalcerita'],
  async execute(sock, msg, args, ctx) {
    const { config, from, sender, gameState, setGameTimeout, random } = ctx;
    const mode = (args[0] || '').toLowerCase();

    let soal;
    let judul;
    let reward;
    if (mode === 'biasa' || mode === 'angka') {
      // Mode klasik: hitungan polos tanpa cerita.
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const op = random(['+', '-', 'x']);
      const jawab = op === '+' ? a + b : op === '-' ? a - b : a * b;
      soal = { q: `${a} ${op} ${b} = ?`, a: jawab };
      judul = '🧮 *MATH*';
      reward = [2, 500];
    } else {
      const level = LEVEL_ALIASES[mode];
      soal = generateStoryProblem({ level });
      const info = LEVEL_REWARD[soal.level];
      judul = `📖 *MATH SOAL CERITA* — ${info.label}`;
      reward = [info.point, info.money];
    }

    const jawab = String(soal.a);
    gameState[from] = { game: 'math', jawab, sender, reward };
    setGameTimeout(from, async () => {
      await sock.sendMessage(from, { text: `⏰ *WAKTU HABIS!*\n\nJawaban: *${jawab}*` });
    });
    await sock.sendMessage(from, {
      text: `${judul}\n\n${soal.q}\n\n💬 *Ketik jawaban (angka saja) langsung di chat — rebutan!*\n🏳️ Ketik *nyerah* untuk skip\n\n⏱️ ${ctx.gameDurationText || '2 menit'} | +${reward[0]} Point, +Rp ${reward[1].toLocaleString('id-ID')}\n_Mode lain: ${config.prefix}math mudah/sedang/sulit/biasa_`,
    });
  },
};
