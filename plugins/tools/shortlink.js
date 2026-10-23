const { getText, isHttpUrl } = require('../../lib/http');

async function shorten(url) {
  const errors = [];
  for (const endpoint of [
    `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
  ]) {
    try {
      const result = (await getText(endpoint, {}, 12000)).trim();
      if (/^https?:\/\/\S+$/.test(result)) return result;
      errors.push(result.slice(0, 80));
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(errors.join('; '));
}

module.exports = {
  name: 'shortlink',
  category: 'tools',
  aliases: ['short', 'shorturl', 'pendekkan'],
  shorten,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const url = args[0];
    if (!url || !isHttpUrl(url)) return sock.sendMessage(from, { text: `🔗 Format: *${config.prefix}shortlink <url>*\nContoh: ${config.prefix}shortlink https://github.com` }, { quoted: msg });
    try {
      const short = await shorten(url);
      await sock.sendMessage(from, { text: `🔗 *SHORTLINK*\n\nAsli: ${url}\nPendek: *${short}*` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal memendekkan link: ${error.message}` }, { quoted: msg });
    }
  },
};
