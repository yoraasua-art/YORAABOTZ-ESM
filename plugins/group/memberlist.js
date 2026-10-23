const { requireGroupAdmin, digits } = require('../../lib/group-utils');

module.exports = {
  name: 'memberlist',
  category: 'group',
  aliases: ['listmember', 'members', 'daftarmember'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const limit = Math.min(Math.max(Number(args[0]) || 100, 1), 300);
    const shown = roles.participants.slice(0, limit);
    const lines = shown.map((p, i) => `${i + 1}. @${digits(p.id)}${p.admin ? ' 🛡️' : ''}`);
    await sock.sendMessage(from, { text: `👥 *DAFTAR MEMBER*\nTotal: ${roles.participants.length}\nDitampilkan: ${shown.length}\n\n${lines.join('\n')}`, mentions: shown.map(p => p.id) }, { quoted: msg });
  },
};
