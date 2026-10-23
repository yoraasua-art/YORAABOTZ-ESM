// plugins/owner/delowner.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'delowner',
  category: 'owner',
  aliases: ['delown', 'hapusowner', 'removeowner'],
  description: 'Hapus owner tambahan (owner only)',
  async execute(sock, msg, args, ctx) {
    const { config, from, getTarget, cleanNumber, reloadOwners, OWNERS_PATH } = ctx;

    let isOwner = false;
    try { isOwner = ctx.isSenderOwner(); } catch (e) {}
    if (!isOwner) {
      return sock.sendMessage(from, { text: '❌ Khusus owner!' }, { quoted: msg });
    }

    let target = null;
    try { target = getTarget(args); } catch (e) {}
    if (!target) {
      return sock.sendMessage(from, {
        text: '📝 *FORMAT*\n\n• `' + config.prefix + 'delowner @user`\n• `' + config.prefix + 'delowner 628123456789`',
      }, { quoted: msg });
    }

    const number = cleanNumber(target);

    // Cek jangan hapus owner utama
    if (number === cleanNumber(config.ownerNumber)) {
      return sock.sendMessage(from, { text: '⚠️ Tidak bisa hapus owner utama (config).' }, { quoted: msg });
    }

    // Load owners
    let owners = [];
    try {
      if (fs.existsSync(OWNERS_PATH)) {
        owners = JSON.parse(fs.readFileSync(OWNERS_PATH, 'utf-8'));
        if (!Array.isArray(owners)) owners = [];
      }
    } catch (e) { owners = []; }

    const before = owners.length;
    owners = owners.filter(o => cleanNumber(o.jid || o) !== number);

    if (owners.length === before) {
      return sock.sendMessage(from, { text: '⚠️ Nomor tidak ada di daftar owner tambahan.' }, { quoted: msg });
    }

    try {
      fs.writeFileSync(OWNERS_PATH, JSON.stringify(owners, null, 2));
      if (typeof reloadOwners === 'function') reloadOwners();
    } catch (e) {
      return sock.sendMessage(from, { text: '❌ Gagal simpan: ' + e.message }, { quoted: msg });
    }

    await sock.sendMessage(from, {
      text:
        '╔══════════════════════════════════╗\n' +
        '║   🗑️ *OWNER BERHASIL DIHAPUS*     ║\n' +
        '╚══════════════════════════════════╝\n\n' +
        '  👤 Nomor    : *' + number + '*\n' +
        '  📊 Sisa     : *' + (owners.length + 1) + ' owner*\n' +
        '  📅 Waktu    : *' + new Date().toLocaleString('id-ID') + '*',
    }, { quoted: msg });
  },
};