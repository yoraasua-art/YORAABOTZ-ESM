const { findMedia, downloadFound } = require('../../lib/quoted-media');
const { removeBackground } = require('../../lib/ai-removebg');
const maker = require('../../lib/sticker-maker');

module.exports = {
  name: 'removebg',
  category: 'tools',
  aliases: ['nobg', 'hapusbg', 'rbg'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const found = findMedia(msg, ['imageMessage', 'stickerMessage']);
    if (!found) return sock.sendMessage(from, { text: `❌ Kirim/reply foto dengan *${config.prefix}removebg*\nTambahkan *sticker* untuk hasil berupa sticker: ${config.prefix}removebg sticker` }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Menghapus background (pertama kali bisa lebih lama karena model AI diunduh)...' }, { quoted: msg });
    try {
      const buffer = await downloadFound(found, ctx, 10 * 1024 * 1024);
      const image = await removeBackground(buffer);
      if (/^(s|sticker|stiker)$/i.test(args[0] || '')) {
        return sock.sendMessage(from, { sticker: await maker.toSticker(image, maker.packOf(config)) }, { quoted: msg });
      }
      await sock.sendMessage(from, { document: image, mimetype: 'image/png', fileName: 'removebg.png', caption: '✅ Background berhasil dihapus (PNG transparan).' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal menghapus background: ${error.message}` }, { quoted: msg });
    }
  },
};
