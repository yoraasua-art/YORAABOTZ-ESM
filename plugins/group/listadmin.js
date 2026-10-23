const { digits } = require('../../lib/group-utils');

module.exports = {
  name: 'listadmin',
  category: 'group',
  aliases: ['adminlist', 'admin', 'admins'],
  async execute(sock, msg, args, ctx) {
    const { from, isGroup } = ctx;
    if (!isGroup(from)) return sock.sendMessage(from, { text: '❌ Command ini hanya bisa digunakan di grup.' }, { quoted: msg });
    const meta = await sock.groupMetadata(from);
    const admins = (meta.participants || []).filter(participant => participant.admin);
    if (!admins.length) return sock.sendMessage(from, { text: 'Grup ini tidak memiliki admin.' }, { quoted: msg });
    const lines = admins.map((participant, index) => `${index + 1}. @${digits(participant.id)}${participant.admin === 'superadmin' ? ' 👑' : ''}`);
    await sock.sendMessage(from, {
      text: `👮 *ADMIN ${meta.subject}*\n\n${lines.join('\n')}\n\nTotal: ${admins.length} admin`,
      mentions: admins.map(participant => participant.id),
    }, { quoted: msg });
  },
};
