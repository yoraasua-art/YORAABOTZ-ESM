module.exports = {
  name: 'leave',
  category: 'owner',
  aliases: ['keluar', 'leavegc', 'out'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner, isGroup } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    const target = args[0]?.endsWith('@g.us') ? args[0] : (isGroup(from) ? from : null);
    if (!target) return sock.sendMessage(from, { text: `Format: *${config.prefix}leave* (di dalam grup) atau *${config.prefix}leave <id grup>* (lihat ${config.prefix}listgc)` }, { quoted: msg });
    try {
      if (target === from) await sock.sendMessage(from, { text: `👋 ${config.botName} keluar dari grup ini. Terima kasih semuanya!` });
      await sock.groupLeave(target);
      if (target !== from) await sock.sendMessage(from, { text: `✅ Bot sudah keluar dari ${target}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal keluar grup: ${error.message}` }, { quoted: msg });
    }
  },
};
