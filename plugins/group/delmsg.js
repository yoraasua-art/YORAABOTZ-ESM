const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'delmsg',
  category: 'group',
  aliases: ['delete', 'hapusmsg', 'del'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: true })) return;
    const info = msg.message?.extendedTextMessage?.contextInfo;
    if (!info?.stanzaId) return sock.sendMessage(from, { text: '↩️ Balas pesan yang ingin dihapus dengan *.delmsg*.' }, { quoted: msg });
    try {
      await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.stanzaId, participant: info.participant } });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal menghapus pesan: ${error.message}` }, { quoted: msg });
    }
  },
};
