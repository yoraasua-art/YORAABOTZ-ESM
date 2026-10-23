const crypto = require('node:crypto');

module.exports = {
  name: 'kodeacak',
  command: ['kodeacak', 'gencode'],
  aliases: ['gencode', 'randomcode'],
  category: 'tools',
  tags: ['tools', 'generator'],
  help: ['kodeacak [panjang]'],
  description: 'Membuat kode alfanumerik acak untuk voucher, token, atau testing.',
  async execute(sock, msg, args, ctx) {
    const length = Math.min(32, Math.max(4, Number.parseInt(args[0] || '10', 10) || 10));
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) code += chars[bytes[i] % chars.length];
    return sock.sendMessage(ctx.from, {
      text: `🎟️ *KODE ACAK*\n\nKode: \`${code}\`\nPanjang: *${length} karakter*`,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
