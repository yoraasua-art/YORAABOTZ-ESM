const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menuutilitas',
  category: 'menu',
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const menuText = renderMenu({
      botName: config.botName,
      title: 'UTILITAS',
      prefix: config.prefix,
      sections: [{ icon: '⚙️', title: 'ALAT BANTU', items: [
        `${config.prefix}bmi <berat> <tinggi>`,
        `${config.prefix}acakangka <minimum> <maksimum>`,
        `${config.prefix}reminder <5m> <pesan>`,
        `${config.prefix}cekpasangan <nama1> + <nama2>`,
        `${config.prefix}kalkulator <ekspresi>`,
        `${config.prefix}kurs <jumlah> <dari> <ke>`,
        `${config.prefix}shortlink <url>`,
        `${config.prefix}tts [bahasa] <teks>`,
        `${config.prefix}ssweb <url> [hp]`,
        `${config.prefix}hash <algoritma> <teks>`,
        `${config.prefix}urlencode <teks>`,
        `${config.prefix}urldecode <kode>`,
        `${config.prefix}binary encode/decode <data>`,
        `${config.prefix}hex encode/decode <data>`,
        `${config.prefix}reverse <teks>`,
        `${config.prefix}counttext <teks>`,
        `${config.prefix}jsonformat <JSON>`,
        `${config.prefix}tanggal [+hari]`,
        `${config.prefix}timezone <kota>`,
      ] }, { icon: '🖼️', title: 'GAMBAR (AI LOKAL)', items: [
        `${config.prefix}removebg [sticker] (balas foto)`,
        `${config.prefix}ocr (balas gambar berisi tulisan)`,
      ] }],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};