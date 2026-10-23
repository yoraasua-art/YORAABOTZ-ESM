const gameEngine = require('../../lib/game-engine');

const SOAL_PROFESI = [
  { soal: 'Profesi orang yang bertugas menerbangkan pesawat terbang komersial maupun militer?', jawaban: 'Pilot' },
  { soal: 'Profesi orang yang mengemudikan kereta api di atas rel?', jawaban: 'Masinis' },
  { soal: 'Profesi orang yang memimpin kapal laut saat berlayar di samudra?', jawaban: 'Nakhoda' },
  { soal: 'Profesi orang yang meracik dan memastikan dosis obat di apotek atau rumah sakit?', jawaban: 'Apoteker' },
  { soal: 'Profesi orang yang merancang desain dan struktur bangunan gedung atau rumah?', jawaban: 'Arsitek' },
  { soal: 'Profesi orang yang memasak hidangan profesional di dapur restoran atau hotel?', jawaban: 'Koki' },
  { soal: 'Profesi orang yang bertugas memadamkan kebakaran dan mengevakuasi bencana?', jawaban: 'Pemadam Kebakaran' },
  { soal: 'Profesi orang yang pergi ke luar angkasa menggunakan pesawat ulang-alik?', jawaban: 'Astronot' },
  { soal: 'Profesi orang yang mencari, menulis, dan melaporkan berita untuk media massa?', jawaban: 'Wartawan' },
  { soal: 'Profesi orang yang memimpin persidangan dan memutus perkara hukum di pengadilan?', jawaban: 'Hakim' }
];

module.exports = {
  name: 'tebakprofesi',
  command: ['tebakprofesi', 'profesi'],
  aliases: ['profesi'],
  category: 'game',
  tags: ['game'],
  help: ['tebakprofesi'],
  description: 'Game menebak nama pekerjaan dan profesi',
  async execute(ctx) {
    const pick = SOAL_PROFESI[Math.floor(Math.random() * SOAL_PROFESI.length)];
    if (gameEngine && typeof gameEngine.startGame === 'function') {
      return gameEngine.startGame(ctx, {
        gameName: 'Tebak Profesi',
        question: pick.soal,
        answer: pick.jawaban,
        rewardMoney: 1400,
        rewardExp: 115
      });
    }
    return ctx.reply(`👨‍⚕️ *TEBAK PROFESI*\n\nSoal: ${pick.soal}\n💡 Petunjuk: ` + '`' + `${pick.jawaban[0]} ${Array(pick.jawaban.length - 1).fill('_').join(' ')}` + '`' + ` (${pick.jawaban.length} huruf)`);
  }
};
module.exports.handler = module.exports.execute;
