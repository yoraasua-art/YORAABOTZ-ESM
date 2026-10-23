const sharp = require('sharp');
const { findMedia, downloadFound } = require('../../lib/quoted-media');

module.exports = {
  name: 'setppbot',
  category: 'owner',
  aliases: ['setpp', 'setprofilbot'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    const found = findMedia(msg, ['imageMessage']);
    if (!found) return sock.sendMessage(from, { text: `❌ Kirim/reply foto dengan *${config.prefix}setppbot*` }, { quoted: msg });
    try {
      const buffer = await downloadFound(found, ctx, 10 * 1024 * 1024);
      const image = await sharp(buffer).rotate().resize(640, 640, { fit: 'cover' }).jpeg({ quality: 90 }).toBuffer();
      await sock.updateProfilePicture(sock.user.id, image);
      await sock.sendMessage(from, { text: '✅ Foto profil bot berhasil diganti.' }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengganti foto profil: ${error.message}` }, { quoted: msg });
    }
  },
};
