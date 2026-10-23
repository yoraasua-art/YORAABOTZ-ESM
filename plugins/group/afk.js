const afk = require('../../lib/afk');

module.exports = {
  name: 'afk',
  category: 'group',
  aliases: ['brb'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, pushName, updateUser, loadDB, isGroup } = ctx;
    const identities = [sender, msg.key?.participant, msg.key?.participantAlt, msg.key?.participantPn, msg.key?.remoteJidAlt];
    const existing = afk.findAfk(loadDB(), sender);
    const status = afk.setAfk({ updateUser }, existing?.key || sender, identities, args.join(' '));
    const name = pushName || afk.digits(sender);

    await sock.sendMessage(from, {
      text: `😴 *${name}* sekarang AFK${existing ? ' (alasan diperbarui)' : ''}.\n📝 Alasan: ${status.reason}\n\n` +
        (isGroup(from)
          ? '_Kalau ada yang men-tag kamu, bot akan memberi tahu. Kirim pesan apa saja untuk kembali._'
          : '_Status ini berlaku di semua grup. Kirim pesan di grup untuk kembali._'),
    }, { quoted: msg });
  },
};
