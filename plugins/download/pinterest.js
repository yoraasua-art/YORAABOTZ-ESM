const media = require('../../lib/media-dl');
const { fetchBuffer } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');

module.exports = {
  name: 'pinterest',
  category: 'download',
  aliases: ['pin', 'pinterestdl'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const parsed = parseDownloadOptions(args);
    const input = args.join(' ').trim();
    if (!input) {
      return sock.sendMessage(from, { text: `📌 Contoh:\n• *${config.prefix}pinterest https://pin.it/xxxx* — download pin\n• *${config.prefix}pinterest kucing lucu* — cari gambar` }, { quoted: msg });
    }
    const url = media.firstUrl(args);
    try {
      if (url) {
        if (!media.hostMatches(url, ['pinterest.com', 'pin.it', 'pinterest.co.uk', 'id.pinterest.com'])) {
          return sock.sendMessage(from, { text: '❌ Link bukan dari Pinterest.' }, { quoted: msg });
        }
        const pin = await media.downloadPinterest(url, { ...parsed.opts, maxBytes: parsed.maxBytes });
        const buffer = await fetchBuffer(pin.url, { maxBytes: parsed.maxBytes });
        const caption = `📌 ${pin.title || 'Pinterest'}`;
        if (pin.type === 'video') return sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4', caption }, { quoted: msg });
        return sock.sendMessage(from, { image: buffer, caption }, { quoted: msg });
      }
      const results = await media.searchPinterest(input, 1);
      const buffer = await fetchBuffer(results[0], { maxBytes: 10 * 1024 * 1024 });
      await sock.sendMessage(from, { image: buffer, caption: `📌 Hasil Pinterest: *${input}*\nKetik ulang command untuk gambar lain.` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil Pinterest: ${error.message}` }, { quoted: msg });
    }
  },
};
