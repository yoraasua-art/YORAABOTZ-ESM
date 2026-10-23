const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'addmember',
  category: 'group',
  aliases: ['add', 'tambahmember'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    const raw = args[0]?.replace(/[^0-9]/g, '');
    if (!raw || raw.length < 8) return sock.sendMessage(from, { text: `Format: *${config.prefix}addmember 628xxxxxxxxxx*` }, { quoted: msg });
    try {
      const result = await sock.groupParticipantsUpdate(from, [`${raw}@s.whatsapp.net`], 'add');
      const status = result?.[0]?.status;
      await sock.sendMessage(from, { text: status === '200' ? `✅ @${raw} berhasil ditambahkan.` : `ℹ️ Permintaan tambah @${raw} diproses dengan status ${status || 'unknown'}.`, mentions: [`${raw}@s.whatsapp.net`] }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal menambahkan member: ${error.message}` }, { quoted: msg });
    }
  },
};
