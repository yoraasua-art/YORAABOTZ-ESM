const { digits } = require('../../lib/group-utils');

module.exports = {
  name: 'blocklist',
  category: 'owner',
  aliases: ['listblock', 'blokir'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    const action = ['block', 'unblock'].includes(args[0]?.toLowerCase()) ? args.shift().toLowerCase() : null;
    try {
      if (action) {
        const mentioned = ctx.mentioned?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
        const number = args.join('').replace(/\D/g, '');
        const target = mentioned || (number.length >= 8 ? `${number}@s.whatsapp.net` : null);
        if (!target) return sock.sendMessage(from, { text: `Format: *${config.prefix}blocklist ${action} @user* atau nomor 628xxx` }, { quoted: msg });
        await sock.updateBlockStatus(target, action);
        return sock.sendMessage(from, { text: `✅ @${digits(target)} berhasil di-${action}.`, mentions: [target] }, { quoted: msg });
      }
      const list = await sock.fetchBlocklist();
      if (!list?.length) return sock.sendMessage(from, { text: '✅ Tidak ada nomor yang diblokir.' }, { quoted: msg });
      const lines = list.map((jid, index) => `${index + 1}. @${digits(jid)}`);
      await sock.sendMessage(from, { text: `🚫 *DAFTAR BLOKIR* (${list.length})\n\n${lines.join('\n')}\n\n• ${config.prefix}blocklist block @user\n• ${config.prefix}blocklist unblock @user`, mentions: list }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal memproses blokir: ${error.message}` }, { quoted: msg });
    }
  },
};
