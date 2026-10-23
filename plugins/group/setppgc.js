const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'setppgc',
  category: 'group',
  aliases: ['setfotogc', 'gcpp'],
  async execute(sock, msg, args, ctx) {
    const { from, downloadMediaMessage } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx)) return;
    const image = msg.message?.imageMessage ? msg : msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ? {
      key: { remoteJid: from, id: msg.message.extendedTextMessage.contextInfo.stanzaId, participant: msg.message.extendedTextMessage.contextInfo.participant },
      message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
    } : null;
    if (!image) return sock.sendMessage(from, { text: '🖼️ Kirim/balas foto lalu gunakan *.setppgc*.' }, { quoted: msg });
    try {
      const buffer = await downloadMediaMessage(image, 'buffer', {}, { logger: console });
      await sock.updateProfilePicture(from, buffer);
      await sock.sendMessage(from, { text: '✅ Foto profil grup berhasil diperbarui.' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah foto grup: ${error.message}` }, { quoted: msg });
    }
  },
};
