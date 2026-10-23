const islami = require('../../lib/islami');

module.exports = {
  name: 'ayatacak',
  category: 'islami',
  aliases: ['randomayat', 'ayathariini'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    try {
      const list = await islami.getSurahList();
      const pick = list[Math.floor(Math.random() * list.length)];
      const surah = await islami.getSurah(pick.nomor);
      const ayat = surah.ayat[Math.floor(Math.random() * surah.ayat.length)];
      await sock.sendMessage(from, { text: `✨ *AYAT PILIHAN*\n\n${islami.formatAyat(surah, ayat)}\n\n_(QS. ${surah.namaLatin} [${surah.nomor}]: ${ayat.nomorAyat})_` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil ayat: ${error.message}` }, { quoted: msg });
    }
  },
};
