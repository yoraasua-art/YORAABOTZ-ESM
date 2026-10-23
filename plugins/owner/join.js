module.exports = {
  name: 'join',
  category: 'owner',
  aliases: ['joingc', 'masukgc'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    const code = (args.join(' ').match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,})/) || [])[1];
    if (!code) return sock.sendMessage(from, { text: `Format: *${config.prefix}join https://chat.whatsapp.com/xxxx*` }, { quoted: msg });
    try {
      const info = await sock.groupGetInviteInfo(code).catch(() => null);
      const groupId = await sock.groupAcceptInvite(code);
      await sock.sendMessage(from, { text: `✅ Bot berhasil bergabung${info?.subject ? ` ke *${info.subject}*` : ''}.${groupId ? `\nID: ${groupId}` : '\n(Jika grup memakai persetujuan admin, tunggu disetujui.)'}` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal bergabung: ${error.message}` }, { quoted: msg });
    }
  },
};
