const { evaluate } = require('../../lib/calculator');

module.exports = {
  name: 'kalkulator',
  category: 'tools',
  aliases: ['kalk', 'calc', 'hitung', 'calculator'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const expression = args.join(' ').trim();
    if (!expression) {
      return sock.sendMessage(from, { text: `🧮 Format: *${config.prefix}kalk <ekspresi>*\nContoh: ${config.prefix}kalk (12+8)*3^2\nDukungan: + - × ÷ % ^ !, sqrt(), sin(), cos(), tan() (derajat), log(), ln(), pi, e` }, { quoted: msg });
    }
    try {
      const result = evaluate(expression);
      await sock.sendMessage(from, { text: `🧮 *KALKULATOR*\n\n${expression}\n= *${result.toLocaleString('id-ID', { maximumFractionDigits: 10 })}*` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ ${error.message}` }, { quoted: msg });
    }
  },
};
