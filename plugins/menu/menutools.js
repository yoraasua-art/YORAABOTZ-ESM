const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menutools',
  category: 'menu',
  aliases: ['menutool'],
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const menuText = renderMenu({
      botName: config.botName,
      title: 'AI & UTILITAS',
      prefix: config.prefix,
      sections: [
        { icon: '🧰', title: 'KATEGORI ALAT', items: [
          `${config.prefix}menuinfo — informasi dan pencarian`,
          `${config.prefix}menuai — asisten AI dan bahasa`,
          `${config.prefix}menuutilitas — alat bantu harian`,
        ] },
        { icon: '🧩', title: 'UTILITAS BARU', items: [
          `${config.prefix}base64 encode/decode <teks>`,
          `${config.prefix}textcase upper/lower/title <teks>`,
          `${config.prefix}uuid [jumlah]`,
          `${config.prefix}timestamp`,
          `${config.prefix}terbilang <angka>`,
          `${config.prefix}kodeacak [panjang]`,
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
        ] },
      ],
      footer: ['Pilih kategori untuk melihat fitur terkait.'],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};
