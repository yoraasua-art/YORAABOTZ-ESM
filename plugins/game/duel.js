const pvp = require('../../lib/pvp');

module.exports = {
  name: 'duel',
  category: 'game',
  aliases: ['fight', 'tarung'],
  async execute(sock, msg, args, ctx) {
    const action = (args[0] || '').toLowerCase();
    if (['terima', 'tolak', 'batal'].includes(action)) {
      const handled = await pvp.respond(sock, msg, ctx, action === 'terima');
      if (!handled) await sock.sendMessage(ctx.from, { text: '❌ Tidak ada tantangan duel untukmu.' }, { quoted: msg });
      return;
    }
    return pvp.createChallenge('duel', sock, msg, args, ctx);
  },
};
