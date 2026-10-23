const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'linkgc',
  category: 'group',
  aliases: ['linkgroup', 'linkgrup', 'gclink'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx);
    if (!roles) return;
    try {
      const code = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `🔗 *LINK GRUP ${roles.meta.subject}*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil link grup: ${error.message}` }, { quoted: msg });
    }
  },
};
