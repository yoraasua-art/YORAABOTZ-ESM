const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menupicker',
  category: 'menu',
  aliases: ['menukategori', 'menucategory', 'pickmenu'],
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const prefix = config.prefix || '.';
    const isOwner = Boolean(ctx.isSenderOwner && ctx.isSenderOwner());
    const items = [
      `${prefix}menuall — semua fitur`,
      `${prefix}menuai — AI`,
      `${prefix}menudownload — downloader`,
      `${prefix}menugame — permainan`,
      `${prefix}menufun — hiburan`,
      `${prefix}menuekonomi — ekonomi dan toko`,
      `${prefix}menulevel — level dan peringkat`,
      `${prefix}menugroup — pengaturan grup`,
      `${prefix}menumedia — media dan stiker`,
      `${prefix}menuislami — fitur Islami`,
      `${prefix}menutools — tools dan utilitas`,
      `${prefix}menuinfo — informasi bot`,
      ...(isOwner ? [`${prefix}menuowner — panel owner`] : []),
    ];
    const text = renderMenu({
      botName: config.botName || 'Yora Botz',
      title: 'PILIH KATEGORI',
      prefix,
      sections: [{ icon: '📚', title: 'DAFTAR MENU', items }],
      footer: ['Ketik perintah kategori yang ingin dibuka.', 'Menu ini memakai teks, tanpa tombol interaktif.'],
    });
    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
