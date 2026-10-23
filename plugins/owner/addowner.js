// plugins/owner/addowner.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'addowner',
  category: 'owner',
  aliases: ['addown', 'tambahowner'],
  description: 'Tambah owner baru (owner only)',
  async execute(sock, msg, args, ctx) {
    const { config, from, getTarget, cleanNumber, loadExtraOwners, reloadOwners, OWNERS_PATH } = ctx;

    // Cek owner
    let isOwner = false;
    try { isOwner = ctx.isSenderOwner(); } catch (e) {}
    if (!isOwner) {
      return sock.sendMessage(from, { text: '❌ Khusus owner!' }, { quoted: msg });
    }

    // Ambil target
    let target = null;
    try { target = getTarget(args); } catch (e) {}
    if (!target) {
      return sock.sendMessage(from, {
        text: '📝 *FORMAT*\n\n' +
          '• `' + config.prefix + 'addowner @user`\n' +
          '• `' + config.prefix + 'addowner 628123456789`\n' +
          '• Reply pesan user, lalu `' + config.prefix + 'addowner`',
      }, { quoted: msg });
    }

    // Normalisasi nomor
    let number = cleanNumber(target);
    if (!number || number.length < 10) {
      return sock.sendMessage(from, { text: '❌ Nomor tidak valid!' }, { quoted: msg });
    }
    const jid = number + '@s.whatsapp.net';

    // Cek sudah owner?
    const ownerNum = cleanNumber(config.ownerNumber);
    if (number === ownerNum) {
      return sock.sendMessage(from, { text: '⚠️ User sudah jadi owner utama (config).' }, { quoted: msg });
    }

    // Load owners
    let owners = [];
    try {
      if (fs.existsSync(OWNERS_PATH)) {
        owners = JSON.parse(fs.readFileSync(OWNERS_PATH, 'utf-8'));
        if (!Array.isArray(owners)) owners = [];
      }
    } catch (e) { owners = []; }

    // Cek sudah ada di list?
    if (owners.some(o => cleanNumber(o.jid || o) === number)) {
      return sock.sendMessage(from, { text: '⚠️ User sudah jadi owner tambahan.' }, { quoted: msg });
    }

    // Simpan
    owners.push({
      jid: jid,
      addedAt: Date.now(),
      addedBy: ctx.sender,
    });

    try {
      const dir = path.dirname(OWNERS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(OWNERS_PATH, JSON.stringify(owners, null, 2));
      if (typeof reloadOwners === 'function') reloadOwners();
    } catch (e) {
      return sock.sendMessage(from, { text: '❌ Gagal simpan: ' + e.message }, { quoted: msg });
    }

    await sock.sendMessage(from, {
      text:
        '╔══════════════════════════════════╗\n' +
        '║   ✅ *OWNER BERHASIL DITAMBAH*    ║\n' +
        '╚══════════════════════════════════╝\n\n' +
        '  👤 Nomor    : *' + number + '*\n' +
        '  📊 Total    : *' + (owners.length + 1) + ' owner*\n' +
        '  📅 Waktu    : *' + new Date().toLocaleString('id-ID') + '*\n\n' +
        '💡 Owner baru sekarang bisa akses command owner.',
      mentions: [jid],
    }, { quoted: msg });
  },
};