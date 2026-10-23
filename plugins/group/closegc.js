const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'closegc',
  category: 'group',
  aliases: ['tutupgc', 'tutupgrup'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    try {
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: '🔒 Grup ditutup. Hanya admin yang dapat mengirim pesan.' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah pengaturan grup: ${error.message}` }, { quoted: msg });
    }
  },
};
