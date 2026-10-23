const { findMedia, downloadFound } = require('../../lib/quoted-media');
const maker = require('../../lib/sticker-maker');

module.exports = {
  name: 'wm',
  category: 'sticker',
  aliases: ['take', 'swm', 'colong'],
  async execute(sock, msg, args, ctx) {
    const { from, config, user } = ctx;
    const found = findMedia(msg, ['stickerMessage', 'imageMessage', 'videoMessage']);
    if (!found) {
      return sock.sendMessage(from, { text: `❌ Reply sticker/gambar dengan *${config.prefix}wm <pack>|<author>*\nContoh: ${config.prefix}wm Punyaku|${config.botName}` }, { quoted: msg });
    }
    const [pack, author] = args.join(' ').split('|').map(part => part?.trim());
    try {
      const buffer = await downloadFound(found, ctx, 15 * 1024 * 1024);
      const sticker = await maker.toSticker(buffer, {
        pack: (pack || user?.name || config.botName).slice(0, 60),
        author: (author ?? (pack ? '' : config.ownerName) ?? '').slice(0, 60),
      });
      await sock.sendMessage(from, { sticker }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengganti watermark: ${error.message}` }, { quoted: msg });
    }
  },
};
