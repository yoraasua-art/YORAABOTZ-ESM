const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menudownload',
  category: 'menu',
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const menuText = renderMenu({
      botName: config.botName,
      title: 'UNDUH MEDIA',
      prefix: config.prefix,
      sections: [{ icon: '📥', title: 'VIDEO & AUDIO', items: [
        `${config.prefix}youtube <tautan>`,
        `${config.prefix}ytmp3 <tautan>`,
        `${config.prefix}tiktok <tautan>`,
        `${config.prefix}instagram <tautan>`,
        `${config.prefix}facebook <tautan>`,
        `${config.prefix}twitter <tautan>`,
        `${config.prefix}pinterest <tautan/kata kunci>`,
        `${config.prefix}dl <tautan>`,
        `${config.prefix}ytshorts <tautan shorts>`,
        `${config.prefix}tiktokmp4 <tautan>`,
        `${config.prefix}tiktokphoto <tautan slideshow>`,
        `${config.prefix}igvideo <tautan>`,
        `${config.prefix}igphoto <tautan>`,
        `${config.prefix}xmedia <tautan>`,
        `${config.prefix}fbmedia <tautan>`,
        `${config.prefix}pinmedia <tautan>`,
        `${config.prefix}ytdoc <tautan>`,
        `${config.prefix}downloadoptions`,
        `${config.prefix}providerstatus`,
        `${config.prefix}downloadstats`,
        `${config.prefix}dl <link> --quality 720 --format mp4 --max 30`,
        `${config.prefix}dl <link> slow`,
        `${config.prefix}dl <link> medium`,
        `${config.prefix}dl <link> fast`,
      ] }, { icon: '🎵', title: 'MUSIK', items: [
        `${config.prefix}play <judul lagu>`,
        `${config.prefix}spotify <tautan lagu>`,
      ] }],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};