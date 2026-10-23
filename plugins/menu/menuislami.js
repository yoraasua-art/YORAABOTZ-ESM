const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menuislami',
  category: 'menu',
  aliases: ['menuislam'],
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const menuText = renderMenu({
      botName: config.botName,
      title: 'ISLAMI',
      prefix: config.prefix,
      sections: [
        { icon: '🕌', title: 'SHOLAT', items: [
          `${config.prefix}jadwalsholat <kota> — jadwal sholat hari ini`,
          `${config.prefix}pengingatsholat <kota>/off — pengingat otomatis di grup (admin)`,
        ] },
        { icon: '📖', title: "AL-QUR'AN", items: [
          `${config.prefix}surah <nama/nomor> [halaman] — baca surah + terjemahan`,
          `${config.prefix}surah <nama> audio — murottal`,
          `${config.prefix}surah list — daftar 114 surah`,
          `${config.prefix}ayat <surah:ayat> — contoh: ${config.prefix}ayat 2:255`,
          `${config.prefix}ayatacak — ayat pilihan acak`,
        ] },
        { icon: '🤲', title: 'DOA & DZIKIR', items: [
          `${config.prefix}doa — daftar doa harian`,
          `${config.prefix}doa <nama/nomor/acak> — contoh: ${config.prefix}doa makan`,
          `${config.prefix}asmaulhusna [1-99/all]`,
        ] },
        { icon: '📚', title: 'KISAH & HADIS', items: [
          `${config.prefix}kisahnabi [nama] — kisah 25 nabi`,
          `${config.prefix}hadis [nomor] — hadis pilihan`,
        ] },
        { icon: '🎯', title: 'KUIS', items: [`${config.prefix}tebaksurah — tebak nama surah dari petunjuk`, 'Kirim jawaban langsung di chat, ketik *nyerah* untuk melewati.'] },
      ],
      footer: ['Jadwal sholat: Kemenag RI (myquran.com) · Al-Qur\'an: equran.id'],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};