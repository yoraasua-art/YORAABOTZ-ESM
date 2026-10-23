const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'mentionadmins',
  category: 'group',
  aliases: ['admincall', 'tagadmin', 'tagadmins'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const admins = roles.participants.filter(p => p.admin).map(p => p.id);
    const text = args.join(' ').trim() || `📢 Panggilan untuk para admin grup *${roles.meta.subject}*`;
    await sock.sendMessage(from, { text: `${text}\n\n${admins.map(id => `@${String(id).split('@')[0]}`).join(' ')}`, mentions: admins }, { quoted: msg });
  },
};
