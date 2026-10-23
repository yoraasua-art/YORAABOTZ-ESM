const gameEngine = require('../../lib/game-engine');

const SOAL_NEGARA = [
  { soal: 'Negara yang dijuluki Negeri Matahari Terbit dan terkenal dengan Gunung Fuji?', jawaban: 'Jepang' },
  { soal: 'Negara kepulauan terbesar di dunia yang dilalui garis khatulistiwa dan memiliki Candi Borobudur?', jawaban: 'Indonesia' },
  { soal: 'Negara yang terkenal dengan Menara Eiffel dan museum Louvre di kota Paris?', jawaban: 'Prancis' },
  { soal: 'Negara tempat berdirinya bangunan kuno Piramida Giza dan Sungai Nil?', jawaban: 'Mesir' },
  { soal: 'Negara dengan populasi besar yang memiliki Tembok Besar (Great Wall)?', jawaban: 'China' },
  { soal: 'Negara asal olahraga sepak bola Samba dan hutan hujan Amazon terbesar?', jawaban: 'Brasil' },
  { soal: 'Negara yang terkenal dengan kincir angin, bunga tulip, dan keju Gouda?', jawaban: 'Belanda' },
  { soal: 'Negara di benua selatan yang terkenal dengan hewan Kanguru dan Koala?', jawaban: 'Australia' },
  { soal: 'Negara yang terkenal dengan Menara Miring Pisa, Colosseum, dan makanan Pizza?', jawaban: 'Italia' },
  { soal: 'Negara di Asia Timur yang terkenal dengan budaya K-Pop, kimchi, dan hanbok?', jawaban: 'Korea Selatan' },
  { soal: 'Negara yang dijuluki Negeri Tirai Bambu dan kampung halaman hewan Panda?', jawaban: 'Tiongkok' },
  { soal: 'Negara Asia Tenggara yang terkenal dengan patung Merlion (Singa berbadan ikan)?', jawaban: 'Singapura' },
  { soal: 'Negara yang memiliki Menara Kembar Petronas di Kuala Lumpur?', jawaban: 'Malaysia' },
  { soal: 'Negara tempat berdirinya bangunan Taj Mahal di kota Agra?', jawaban: 'India' },
  { soal: 'Negara yang dijuluki Negeri Gajah Putih dan tidak pernah dijajah bangsa Eropa?', jawaban: 'Thailand' }
];

module.exports = {
  name: 'tebaknegara',
  command: ['tebaknegara', 'negara'],
  aliases: ['negara'],
  category: 'game',
  tags: ['game'],
  help: ['tebaknegara'],
  description: 'Game kuis menebak nama negara dunia dari ciri khasnya',
  async execute(ctx) {
    const pick = SOAL_NEGARA[Math.floor(Math.random() * SOAL_NEGARA.length)];
    if (gameEngine && typeof gameEngine.startGame === 'function') {
      return gameEngine.startGame(ctx, {
        gameName: 'Tebak Negara',
        question: pick.soal,
        answer: pick.jawaban,
        rewardMoney: 1500,
        rewardExp: 120
      });
    }
    return ctx.reply(`🌍 *TEBAK NEGARA*\n\nSoal: ${pick.soal}\n💡 Petunjuk: ` + '`' + `${pick.jawaban[0]} ${Array(pick.jawaban.length - 1).fill('_').join(' ')}` + '`' + ` (${pick.jawaban.length} huruf)\n\n_Ketik *hint* untuk petunjuk atau *nyerah* untuk menyerah._`);
  }
};
module.exports.handler = module.exports.execute;
