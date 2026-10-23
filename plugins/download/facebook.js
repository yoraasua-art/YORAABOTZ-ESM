const media = require('../../lib/media-dl');
const { toMedia } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');

module.exports = {
  name: 'facebook',
  category: 'download',
  aliases: ['fb', 'fbdl'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const parsed = parseDownloadOptions(args);
    const url = parsed.url || media.firstUrl(args);
    if (!url || !media.hostMatches(url, ['facebook.com', 'fb.watch', 'fb.com'])) {
      return sock.sendMessage(from, { text: `❌ Kirim link video Facebook publik.\nContoh: *${config.prefix}fb https://www.facebook.com/watch?v=...*` }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: '⏳ Mengambil video Facebook...' }, { quoted: msg });
    try {
      const data = await media.downloadFacebook(url, { ...parsed.opts, maxBytes: parsed.maxBytes });
      await sock.sendMessage(from, { video: toMedia(data), mimetype: 'video/mp4', caption: `📘 ${data.title || 'Facebook Video'}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ ${error.message}` }, { quoted: msg });
    }
  },
};
