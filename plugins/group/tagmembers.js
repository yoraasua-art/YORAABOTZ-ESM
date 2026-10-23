const { requireGroupAdmin, digits } = require('../../lib/group-utils');

module.exports = {
  name: 'tagmembers',
  category: 'group',
  aliases: ['tagmember', 'mentionmembers'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const members = roles.participants.filter(p => !p.admin);
    const text = args.join(' ').trim() || '📢 Perhatian semua member grup!';
    await sock.sendMessage(from, { text: `${text}\n\n${members.map(p => `@${digits(p.id)}`).join(' ')}`, mentions: members.map(p => p.id) }, { quoted: msg });
  },
};
