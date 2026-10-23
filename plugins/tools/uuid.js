const crypto = require('node:crypto');

module.exports = {
  name: 'uuid',
  command: ['uuid', 'genuuid'],
  aliases: ['genuuid', 'uuidv4'],
  category: 'tools',
  tags: ['tools', 'generator'],
  help: ['uuid [jumlah]'],
  description: 'Membuat UUID v4 acak untuk kebutuhan aplikasi dan testing.',
  async execute(sock, msg, args, ctx) {
    const count = Math.min(10, Math.max(1, Number.parseInt(args[0] || '1', 10) || 1));
    const values = Array.from({ length: count }, () => crypto.randomUUID());
    return sock.sendMessage(ctx.from, {
      text: `🆔 *UUID v4 GENERATOR*\n\n${values.map((value, i) => `${i + 1}. \`${value}\``).join('\n')}`,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
