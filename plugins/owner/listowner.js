// plugins/owner/listowner.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'listowner',
  category: 'owner',
  aliases: ['owners', 'daftarowner'],
  description: 'Lihat daftar owner',
  async execute(sock, msg, args, ctx) {
    const { config, from, cleanNumber, OWNERS_PATH } = ctx;

    let owners = [];
    try {
      if (fs.existsSync(OWNERS_PATH)) {
        owners = JSON.parse(fs.readFileSync(OWNERS_PATH, 'utf-8'));
        if (!Array.isArray(owners)) owners = [];
      }
    } catch (e) { owners = []; }

    const mainNum = cleanNumber(config.ownerNumber);
    const mainLID = cleanNumber(config.ownerLID);

    let txt =
      '╔══════════════════════════════════╗\n' +
      '║        👑 *DAFTAR OWNER*         ║\n' +
      '╚══════════════════════════════════╝\n\n' +
      '╭─────────────────────────────────╮\n' +
      '│  👑  *OWNER UTAMA*\n' +
      '╰─────────────────────────────────╯\n\n' +
      '  • *' + config.ownerName + '*\n' +
      '    📞 ' + mainNum + '\n' +
      (mainLID ? '    🆔 LID: ' + mainLID + '\n' : '') +
      '\n';

    if (owners.length) {
      txt +=
        '╭─────────────────────────────────╮\n' +
        '│  ➕  *OWNER TAMBAHAN* (' + owners.length + ')\n' +
        '╰─────────────────────────────────╯\n\n';
      owners.forEach((o, i) => {
        const num = cleanNumber(o.jid || o);
        const tgl = o.addedAt ? new Date(o.addedAt).toLocaleDateString('id-ID') : '-';
        txt += '  ' + (i + 1) + '. *' + num + '*\n';
        txt += '     📅 Ditambah: ' + tgl + '\n';
      });
    } else {
      txt += '📭 _Belum ada owner tambahan._\n\n';
      txt += '💡 Tambah: *' + config.prefix + 'addowner @user*';
    }

    txt += '\n\n📊 *Total: ' + (owners.length + 1) + ' owner*';
    txt += '\n⚡ _' + config.botName + '_';

    await sock.sendMessage(from, { text: txt }, { quoted: msg });
  },
};