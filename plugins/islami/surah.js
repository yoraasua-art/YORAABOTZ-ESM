const islami = require('../../lib/islami');

const PER_PAGE = 10;

function stripHtml(text) {
  return String(text || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = {
  name: 'surah',
  category: 'islami',
  aliases: ['surat', 'bacasurah'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const words = [...args];
    const wantAudio = words.length > 1 && /^(audio|mp3|murottal)$/i.test(words[words.length - 1]);
    if (wantAudio) words.pop();
    const page = words.length > 1 && /^\d+$/.test(words[words.length - 1]) ? Number(words.pop()) : 1;
    const query = words.join(' ').trim();
    if (!query) {
      return sock.sendMessage(from, {
        text: `📖 Contoh:\n• *${config.prefix}surah al-kahfi* — baca surah\n• *${config.prefix}surah yasin 2* — halaman ke-2\n• *${config.prefix}surah 112 audio* — murottal\n• *${config.prefix}surah list* — daftar surah`,
      }, { quoted: msg });
    }
    try {
      if (/^(list|daftar)$/i.test(query)) {
        const list = await islami.getSurahList();
        const text = list.map(surah => `${surah.nomor}. ${surah.namaLatin} (${surah.jumlahAyat})`).join('\n');
        return sock.sendMessage(from, { text: `📖 *DAFTAR SURAH*\n\n${text}` }, { quoted: msg });
      }
      const found = await islami.findSurah(query);
      if (!found) return sock.sendMessage(from, { text: `❌ Surah *${query}* tidak ditemukan. Ketik *${config.prefix}surah list* untuk melihat daftar.` }, { quoted: msg });
      const surah = await islami.getSurah(found.nomor);

      if (wantAudio) {
        const audioUrl = surah.audioFull?.['05'] || Object.values(surah.audioFull || {})[0];
        if (!audioUrl) return sock.sendMessage(from, { text: '❌ Audio surah ini tidak tersedia.' }, { quoted: msg });
        await sock.sendMessage(from, { text: `🎧 Mengirim murottal *${surah.namaLatin}*...` }, { quoted: msg });
        return sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', fileName: `${surah.namaLatin}.mp3` }, { quoted: msg });
      }

      const pages = Math.ceil(surah.ayat.length / PER_PAGE);
      const current = Math.min(Math.max(page, 1), pages);
      const verses = surah.ayat.slice((current - 1) * PER_PAGE, current * PER_PAGE)
        .map(ayat => `*(${ayat.nomorAyat})* ${ayat.teksArab}\n_${ayat.teksLatin}_\n${ayat.teksIndonesia}`)
        .join('\n\n');
      const header = `📖 *${surah.namaLatin}* (${surah.nama})\n${surah.arti} · ${surah.jumlahAyat} ayat · ${surah.tempatTurun}`;
      const intro = current === 1 ? `\n\n${stripHtml(surah.deskripsi).slice(0, 400)}` : '';
      const footer = pages > 1
        ? `\n\n📄 Halaman ${current}/${pages}${current < pages ? ` — lanjut: *${config.prefix}surah ${surah.nomor} ${current + 1}*` : ''}`
        : '';
      await sock.sendMessage(from, { text: `${header}${intro}\n\n${verses}${footer}\n\n🎧 Murottal: *${config.prefix}surah ${surah.nomor} audio*` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil surah: ${error.message}` }, { quoted: msg });
    }
  },
};
