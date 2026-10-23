const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'setdesc',
  category: 'group',
  aliases: ['setdeskripsi', 'setdescgc'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const description = args.join(' ').trim();
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    if (!description) return sock.sendMessage(from, { text: `Format: *${config.prefix}setdesc <deskripsi baru>*` }, { quoted: msg });
    if (description.length > 2048) return sock.sendMessage(from, { text: '❌ Deskripsi grup maksimal 2048 karakter.' }, { quoted: msg });
    try {
      await sock.groupUpdateDescription(from, description);
      await sock.sendMessage(from, { text: '✅ Deskripsi grup berhasil diperbarui.' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah deskripsi: ${error.message}` }, { quoted: msg });
    }
  },
};
