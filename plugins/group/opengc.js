const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'opengc',
  category: 'group',
  aliases: ['bukagc', 'bukagrup'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    try {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: '🔓 Grup dibuka. Semua anggota dapat mengirim pesan.' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah pengaturan grup: ${error.message}` }, { quoted: msg });
    }
  },
};
