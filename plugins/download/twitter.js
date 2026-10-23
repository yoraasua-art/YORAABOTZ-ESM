const media = require('../../lib/media-dl');
const { fetchBuffer } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');

module.exports = {
  name: 'twitter',
  category: 'download',
  aliases: ['x', 'twt', 'xdl', 'twitterdl'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const parsed = parseDownloadOptions(args);
    const url = parsed.url || media.firstUrl(args);
    if (!url || !media.hostMatches(url, ['twitter.com', 'x.com'])) {
      return sock.sendMessage(from, { text: `❌ Kirim link Twitter/X.\nContoh: *${config.prefix}twitter https://x.com/user/status/123*` }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: '⏳ Mengambil media Twitter/X...' }, { quoted: msg });
    try {
      const tweet = await media.downloadTwitter(url, { ...parsed.opts, maxBytes: parsed.maxBytes });
      if (!tweet.media.length) return sock.sendMessage(from, { text: `📝 Tweet @${tweet.author} tidak memiliki media.\n\n${tweet.text}` }, { quoted: msg });
      const caption = `🐦 @${tweet.author}\n\n${tweet.text}`.slice(0, 1000);
      for (const [index, item] of tweet.media.slice(0, 4).entries()) {
        const buffer = await fetchBuffer(item.url, { maxBytes: parsed.maxBytes });
        await sock.sendMessage(from, { [item.type]: buffer, caption: index === 0 ? caption : undefined, ...(item.type === 'video' ? { mimetype: 'video/mp4' } : {}) }, { quoted: msg });
      }
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal download Twitter/X: ${error.message}` }, { quoted: msg });
    }
  },
};
