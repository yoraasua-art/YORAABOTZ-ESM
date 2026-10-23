const DZIKIR_LIST = [
  {
    arab: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    latin: 'Subhanallahi wa bihamdihi, Subhanallahil adzim',
    arti: 'Maha Suci Allah dan segala puji bagi-Nya, Maha Suci Allah Yang Maha Agung.',
    keutamaan: 'Dua kalimat yang ringan di lisan, namun berat di timbangan amal dan dicintai Ar-Rahman (HR. Bukhari & Muslim).'
  },
  {
    arab: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: 'Laa hawla wa laa quwwata illa billah',
    arti: 'Tidak ada daya dan upaya kecuali dengan pertolongan Allah.',
    keutamaan: 'Merupakan salah satu perbendaharaan (harta simpanan) surga (HR. Bukhari & Muslim).'
  },
  {
    arab: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
    latin: 'Astaghfirullahal adzim wa atuubu ilaih',
    arti: 'Aku memohon ampun kepada Allah Yang Maha Agung dan aku bertaubat kepada-Nya.',
    keutamaan: 'Membuka pintu rezeki dan memberikan jalan keluar dari setiap kesempitan.'
  }
];

module.exports = {
  name: 'dzikir',
  command: ['dzikir', 'wirid', 'zikir'],
  aliases: ['wirid', 'zikir'],
  category: 'islami',
  tags: ['islami'],
  help: ['dzikir', 'wirid'],
  description: 'Menampilkan bacaan dzikir harian beserta teks Arab, Latin, Arti, dan Keutamaannya',
  async execute(ctx) {
    const pick = DZIKIR_LIST[Math.floor(Math.random() * DZIKIR_LIST.length)];
    return ctx.reply(
      `📿 *DZIKIR & WIRID HARIAN* 📿\n\n` +
      `${pick.arab}\n\n` +
      `📖 *Latin:* _${pick.latin}_\n` +
      `🇮🇩 *Arti:* "${pick.arti}"\n\n` +
      `✨ *Keutamaan:* ${pick.keutamaan}`
    );
  }
};
module.exports.handler = module.exports.execute;
