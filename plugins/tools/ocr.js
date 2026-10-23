const { findMedia, downloadFound } = require('../../lib/quoted-media');
const { recognize } = require('../../lib/ai-ocr');

module.exports = {
  name: 'ocr',
  category: 'tools',
  aliases: ['bacateks', 'totext', 'img2text'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const found = findMedia(msg, ['imageMessage', 'stickerMessage']);
    if (!found) return sock.sendMessage(from, { text: `❌ Kirim/reply gambar berisi tulisan dengan *${config.prefix}ocr*` }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Membaca teks dari gambar (pertama kali bisa beberapa menit karena model AI diunduh)...' }, { quoted: msg });
    try {
      const buffer = await downloadFound(found, ctx, 10 * 1024 * 1024);
      const { text } = await recognize(buffer);
      if (!text) return sock.sendMessage(from, { text: '🔍 Tidak ada teks yang terbaca pada gambar.' }, { quoted: msg });
      await sock.sendMessage(from, { text: `📝 *HASIL OCR*\n\n${text.slice(0, 4000)}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal membaca teks: ${error.message}` }, { quoted: msg });
    }
  },
};
