const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'antidelete',
  category: 'group',
  aliases: ['antihapus', 'antidel'],
  async execute(sock, msg, args, ctx) {
    const { from, config, getGroupSettings, updateGroupSettings } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false })) return;
    const action = (args[0] || '').toLowerCase();
    if (action === 'on' || action === 'off') {
      updateGroupSettings(from, { antidelete: action === 'on' });
      return sock.sendMessage(from, {
        text: action === 'on'
          ? '✅ Anti-delete aktif. Pesan yang ditarik pengirimnya akan dikirim ulang oleh bot (pesan maksimal 2 jam terakhir sejak bot menyala).'
          : '✅ Anti-delete dimatikan.',
      }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: `🗑️ *ANTI-DELETE* — status: ${getGroupSettings(from).antidelete ? '✅ aktif' : '❌ nonaktif'}\n\nGunakan *${config.prefix}antidelete on/off*` }, { quoted: msg });
  },
};
