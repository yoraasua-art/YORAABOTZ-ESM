const islami = require('../../lib/islami');

function parseReference(args) {
  const text = args.join(' ').trim();
  let match = text.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (match) return { surah: match[1], ayat: Number(match[2]) };
  match = text.match(/^(.+?)\s*[:\s]\s*(\d{1,3})$/);
  if (match) return { surah: match[1], ayat: Number(match[2]) };
  return null;
}

module.exports = {
  name: 'ayat',
  category: 'islami',
  aliases: ['quran', 'alquran'],
  parseReference,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const ref = parseReference(args);
    if (!ref) {
      return sock.sendMessage(from, { text: `📖 Contoh: *${config.prefix}ayat 2:255* atau *${config.prefix}ayat al-baqarah 255*` }, { quoted: msg });
    }
    try {
      const found = await islami.findSurah(ref.surah);
      if (!found) return sock.sendMessage(from, { text: `❌ Surah *${ref.surah}* tidak ditemukan.` }, { quoted: msg });
      if (ref.ayat < 1 || ref.ayat > found.jumlahAyat) {
        return sock.sendMessage(from, { text: `❌ Surah ${found.namaLatin} hanya memiliki ${found.jumlahAyat} ayat.` }, { quoted: msg });
      }
      const surah = await islami.getSurah(found.nomor);
      const ayat = surah.ayat.find(item => item.nomorAyat === ref.ayat);
      await sock.sendMessage(from, { text: `📖 ${islami.formatAyat(surah, ayat)}\n\n_(QS. ${surah.namaLatin} [${surah.nomor}]: ${ayat.nomorAyat})_` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil ayat: ${error.message}` }, { quoted: msg });
    }
  },
};
