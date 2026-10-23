const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'setnamagc',
  category: 'group',
  aliases: ['setnamegc', 'setsubject', 'gantinamagc'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const name = args.join(' ').trim();
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    if (!name) return sock.sendMessage(from, { text: `Format: *${config.prefix}setnamagc <nama baru>*` }, { quoted: msg });
    if (name.length > 100) return sock.sendMessage(from, { text: '❌ Nama grup maksimal 100 karakter.' }, { quoted: msg });
    try {
      await sock.groupUpdateSubject(from, name);
      await sock.sendMessage(from, { text: `✅ Nama grup diubah menjadi *${name}*` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah nama grup: ${error.message}` }, { quoted: msg });
    }
  },
};
