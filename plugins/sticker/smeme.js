const { findMedia, downloadFound } = require('../../lib/quoted-media');
const maker = require('../../lib/sticker-maker');

module.exports = {
  name: 'smeme',
  category: 'sticker',
  aliases: ['stickermeme', 'memesticker'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const found = findMedia(msg, ['imageMessage', 'stickerMessage']);
    const [top, bottom] = args.join(' ').split('|').map(part => part?.trim() || '');
    if (!found || (!top && !bottom)) {
      return sock.sendMessage(from, { text: `❌ Kirim/reply gambar dengan *${config.prefix}smeme teks atas|teks bawah*\nContoh: ${config.prefix}smeme ketika|bot error` }, { quoted: msg });
    }
    try {
      const buffer = await downloadFound(found, ctx, 10 * 1024 * 1024);
      const image = await maker.memeImage(buffer, top, bottom);
      await sock.sendMessage(from, { sticker: await maker.toSticker(image, maker.packOf(config)) }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal membuat sticker meme: ${error.message}` }, { quoted: msg });
    }
  },
};
