const { getBuffer, isHttpUrl } = require('../../lib/http');
const net = require('net');

function isPrivateHost(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (net.isIP(host)) return /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.)/.test(host) || host === '::1';
  return false;
}

module.exports = {
  name: 'ssweb',
  category: 'tools',
  aliases: ['ss', 'screenshot', 'ssweb2'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    let url = args[0] || '';
    const mobile = /^(hp|mobile)$/i.test(args[1] || '');
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (!url || !isHttpUrl(url)) return sock.sendMessage(from, { text: `📸 Format: *${config.prefix}ssweb <url> [hp]*\nContoh: ${config.prefix}ssweb google.com` }, { quoted: msg });
    if (isPrivateHost(url)) return sock.sendMessage(from, { text: '❌ Alamat lokal/privat tidak diizinkan.' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Mengambil screenshot...' }, { quoted: msg });
    try {
      const width = mobile ? 400 : 1280;
      const image = await getBuffer(`https://image.thum.io/get/width/${width}/crop/${mobile ? 850 : 800}/noanimate/${url}`, { maxBytes: 8 * 1024 * 1024, timeout: 45000 });
      await sock.sendMessage(from, { image, caption: `📸 ${url}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal screenshot: ${error.message}` }, { quoted: msg });
    }
  },
};
