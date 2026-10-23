module.exports = {
  name: 'listgc',
  category: 'owner',
  aliases: ['listgroup', 'listgrup', 'gclist'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    try {
      const groups = Object.values(await sock.groupFetchAllParticipating())
        .sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
      if (!groups.length) return sock.sendMessage(from, { text: 'Bot belum bergabung ke grup mana pun.' }, { quoted: msg });
      const lines = groups.map((group, index) => `${index + 1}. *${group.subject || '(tanpa nama)'}*\n   👥 ${group.participants?.length || 0} member${group.announce ? ' · 🔒 tertutup' : ''}\n   🆔 ${group.id}`);
      await sock.sendMessage(from, { text: `📋 *DAFTAR GRUP BOT* (${groups.length})\n\n${lines.join('\n\n')}\n\nKeluar dari grup: *${config.prefix}leave <id>*` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil daftar grup: ${error.message}` }, { quoted: msg });
    }
  },
};
