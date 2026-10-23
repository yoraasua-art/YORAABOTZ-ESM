const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'botpermissions',
  category: 'group',
  aliases: ['botperm', 'cekizinbot', 'izinbot'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const actions = ['kick/remove member', 'promote/demote admin', 'hapus pesan member', 'ubah nama/deskripsi', 'ubah foto grup', 'tutup/buka grup'];
    const status = roles.botIsAdmin ? '✅ Bot admin — fitur moderasi utama tersedia.' : '⚠️ Bot belum admin — fitur yang membutuhkan hak admin tidak dapat dijalankan.';
    await sock.sendMessage(from, { text: `🤖 *IZIN BOT DI GRUP*\n\n${status}\n\nFitur yang biasanya membutuhkan bot admin:\n${actions.map(a => `• ${a}`).join('\n')}` }, { quoted: msg });
  },
};
