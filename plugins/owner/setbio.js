module.exports = {
  name: 'setbio',
  category: 'owner',
  aliases: ['setstatus', 'setabout'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isSenderOwner } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command khusus owner.' }, { quoted: msg });
    const bio = args.join(' ').trim();
    if (!bio) return sock.sendMessage(from, { text: `Format: *${config.prefix}setbio <teks>*` }, { quoted: msg });
    if (bio.length > 139) return sock.sendMessage(from, { text: '❌ Bio WhatsApp maksimal 139 karakter.' }, { quoted: msg });
    try {
      await sock.updateProfileStatus(bio);
      await sock.sendMessage(from, { text: `✅ Bio bot diubah menjadi:\n_${bio}_` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengubah bio: ${error.message}` }, { quoted: msg });
    }
  },
};
