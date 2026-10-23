const { requireGroupAdmin, targetFromMessage, digits } = require('../../lib/group-utils');

module.exports = {
  name: 'memberinfo',
  category: 'group',
  aliases: ['infomember', 'whoisgc'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const target = targetFromMessage(msg, ctx) || (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);
    if (!target) return sock.sendMessage(from, { text: `Format: *${config.prefix}memberinfo @user* atau balas pesan member.` }, { quoted: msg });
    const p = roles.find(target);
    if (!p) return sock.sendMessage(from, { text: '❌ Member tidak ditemukan di grup ini.' }, { quoted: msg });
    const number = digits(p.id || p.jid || p.phoneNumber);
    await sock.sendMessage(from, { text: `👤 *INFO MEMBER*\n\nNomor: @${number}\nStatus: ${p.admin === 'superadmin' ? '👑 Superadmin' : p.admin ? '🛡️ Admin' : '👤 Member'}\nID: ${p.id || '-'}`, mentions: [p.id] }, { quoted: msg });
  },
};
