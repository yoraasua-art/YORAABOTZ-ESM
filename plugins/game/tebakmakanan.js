const gameEngine = require('../../lib/game-engine');

const SOAL_MAKANAN = [
  { soal: 'Makanan khas Sumatera Barat berbahan daging sapi yang dimasak lama dengan santan dan rempah hingga kering?', jawaban: 'Rendang' },
  { soal: 'Makanan khas Palembang berbahan ikan dan sagu yang disajikan dengan kuah cuko pedas manis?', jawaban: 'Pempek' },
  { soal: 'Makanan khas Yogyakarta yang terbuat dari nangka muda yang dimasak dengan santan hingga manis kecokelatan?', jawaban: 'Gudeg' },
  { soal: 'Makanan khas Jakarta (Betawi) berupa kerak beras ketan yang dimasak dengan telur bebek dan serundeng?', jawaban: 'Kerak Telor' },
  { soal: 'Sup daging berkuah hitam pekat khas Jawa Timur yang menggunakan bumbu kluwek?', jawaban: 'Rawon' },
  { soal: 'Makanan khas Makassar berupa sup daging sapi berempah kacang tanah yang disajikan dengan ketupat?', jawaban: 'Coto Makassar' },
  { soal: 'Makanan khas Maluku dan Papua berupa bubur sagu lengket yang disajikan dengan ikan kuah kuning?', jawaban: 'Papeda' },
  { soal: 'Makanan khas Sunda (Bandung) berbahan kerupuk basah yang dimasak dengan bumbu kencur pedas?', jawaban: 'Seblak' },
  { soal: 'Potongan daging yang ditusuk bambu lalu dibakar menggunakan arang dan diberi bumbu kacang/kecap?', jawaban: 'Sate' },
  { soal: 'Sayuran rebus yang disiram bumbu kacang lengkap dengan lontong, tahu, tempe, dan kerupuk?', jawaban: 'Gado gado' }
];

module.exports = {
  name: 'tebakmakanan',
  command: ['tebakmakanan', 'kuliner'],
  aliases: ['kuliner'],
  category: 'game',
  tags: ['game'],
  help: ['tebakmakanan'],
  description: 'Game menebak kuliner & makanan tradisional Nusantara',
  async execute(ctx) {
    const pick = SOAL_MAKANAN[Math.floor(Math.random() * SOAL_MAKANAN.length)];
    if (gameEngine && typeof gameEngine.startGame === 'function') {
      return gameEngine.startGame(ctx, {
        gameName: 'Tebak Makanan Nusantara',
        question: pick.soal,
        answer: pick.jawaban,
        rewardMoney: 1500,
        rewardExp: 125
      });
    }
    return ctx.reply(`🍲 *TEBAK MAKANAN NUSANTARA*\n\nSoal: ${pick.soal}\n💡 Petunjuk: ` + '`' + `${pick.jawaban[0]} ${Array(pick.jawaban.length - 1).fill('_').join(' ')}` + '`' + ` (${pick.jawaban.length} huruf)`);
  }
};
module.exports.handler = module.exports.execute;
