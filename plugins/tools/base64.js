module.exports = {
  name: 'base64',
  command: ['base64', 'b64'],
  aliases: ['b64', 'base64encode'],
  category: 'tools',
  tags: ['tools', 'encoder'],
  help: ['base64 encode <teks>', 'base64 decode <kode>'],
  description: 'Encode dan decode teks menggunakan Base64.',
  async execute(sock, msg, args, ctx) {
    const mode = String(args[0] || 'encode').toLowerCase();
    const input = args.slice(1).join(' ').trim();
    if (!input || !['encode', 'decode', 'enc', 'dec'].includes(mode)) {
      return sock.sendMessage(ctx.from, {
        text: `🔐 *BASE64*\n\n` +
          `• ${ctx.config.prefix}base64 encode <teks>\n` +
          `• ${ctx.config.prefix}base64 decode <kode>`,
      }, { quoted: msg });
    }
    try {
      const output = /^(decode|dec)$/.test(mode)
        ? Buffer.from(input, 'base64').toString('utf8')
        : Buffer.from(input, 'utf8').toString('base64');
      return sock.sendMessage(ctx.from, {
        text: `🔐 *BASE64 ${/^(decode|dec)$/.test(mode) ? 'DECODE' : 'ENCODE'}*\n\n\`${output}\``,
      }, { quoted: msg });
    } catch (error) {
      return sock.sendMessage(ctx.from, { text: `❌ Gagal memproses Base64: ${error.message}` }, { quoted: msg });
    }
  },
};
module.exports.handler = module.exports.execute;
