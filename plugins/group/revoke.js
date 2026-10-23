const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'revoke',
  category: 'group',
  aliases: ['resetlink', 'revokelink'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    try {
      const code = await sock.groupRevokeInvite(from);
      await sock.sendMessage(from, { text: `✅ Link grup lama sudah tidak berlaku.\n\n🔗 Link baru: https://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mereset link grup: ${error.message}` }, { quoted: msg });
    }
  },
};
