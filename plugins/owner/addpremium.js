// plugins/owner/addpremium.js
module.exports = {
  name: 'addpremium',
  category: 'owner',
  aliases: ['addprem', 'givepremium'],
  description: 'Tambah premium user (owner only)',
  async execute(sock, msg, args, ctx) {
    const { config, from, sender, updateUser, getUser, formatMoney, addPremium } = ctx;
    const P = config.premium || {};

    // ===== CEK OWNER =====
    let isOwner = false;
    try {
      isOwner = ctx.isSenderOwner();
    } catch (e) {}

    if (!isOwner) {
      return sock.sendMessage(from, {
        text: '❌ *AKSES DITOLAK*\n\nHanya owner yang bisa akses command ini.',
      }, { quoted: msg });
    }

    // ===== AMBIL TARGET =====
    let target = null;
    try {
      if (typeof ctx.getTarget === 'function') target = ctx.getTarget(args);
      else if (ctx.mentioned && ctx.mentioned[0]) target = ctx.mentioned[0];
    } catch (e) {}

    if (!target) {
      return sock.sendMessage(from, {
        text: '📝 *FORMAT ADD PREMIUM*\n\n' +
          '• `' + config.prefix + 'addpremium @user 30` — 30 hari\n' +
          '• `' + config.prefix + 'addpremium @user 7` — 7 hari\n' +
          '• `' + config.prefix + 'addpremium @user 1` — 1 hari\n\n' +
          '💡 Bisa juga reply pesan user target, lalu ketik:\n' +
          '`' + config.prefix + 'addpremium 30`\n\n' +
          '⚠️ Default: *' + (P.durationDays || 30) + ' hari*',
      }, { quoted: msg });
    }

    // ===== AMBIL DURASI (HARI) =====
    let days = 0;
    for (const a of args) {
      if (String(a).includes('@')) continue;
      const n = parseInt(String(a).replace(/[^0-9]/g, ''));
      if (Number.isFinite(n) && n > 0) {
        days = n;
        break;
      }
    }
    if (!days) days = P.durationDays || 30;

    // Batas maksimal biar gak ngawur
    if (days > 3650) {
      return sock.sendMessage(from, {
        text: '❌ Maksimal *3650 hari* (10 tahun).',
      }, { quoted: msg });
    }

    // ===== AMBIL DATA TARGET =====
    const targetUser = getUser(target);
    const targetName = targetUser.name || target.split('@')[0];
    const wasPrem = !!(targetUser.premium && targetUser.premiumUntil && targetUser.premiumUntil > Date.now());

    // ===== TAMBAH PREMIUM =====
    let result;
    try {
      result = addPremium(target, days);
    } catch (err) {
      return sock.sendMessage(from, {
        text: '❌ Gagal menambah premium: ' + err.message,
      }, { quoted: msg });
    }

    // ===== FORMAT TANGGAL + WAKTU (dengan jam) =====
    const untilDate = result.until ? new Date(result.until) : null;
    const formatted = result.formatted || '-';

    // Format jam:menit:detik
    let timeText = '';
    if (untilDate && !isNaN(untilDate.getTime())) {
      const hh = String(untilDate.getHours()).padStart(2, '0');
      const mm = String(untilDate.getMinutes()).padStart(2, '0');
      const ss = String(untilDate.getSeconds()).padStart(2, '0');
      timeText = hh + ':' + mm + ':' + ss + ' WIB';
    }

    // Sisa hari user (setelah ditambah)
    const remainingDays = Math.ceil((result.until - Date.now()) / (24 * 60 * 60 * 1000));

    // ===== KIRIM KONFIRMASI =====
    await sock.sendMessage(from, {
      text:
        '╔══════════════════════════════════════╗\n' +
        '║   ✅  *PREMIUM BERHASIL DITAMBAH*    ║\n' +
        '╚══════════════════════════════════════╝\n\n' +
        '  👤 Target   : *' + targetName + '*\n' +
        '  📞 Nomor    : *' + target.split('@')[0] + '*\n' +
        '  ' + (wasPrem ? '💎 Status   : _Extend premium_' : '💎 Status   : _Premium baru_') + '\n\n' +
        '╭─────────────────────────────────────╮\n' +
        '│  ⏱️  *DETAIL PREMIUM*\n' +
        '╰─────────────────────────────────────╯\n\n' +
        '  ◆  ➕ Ditambah  : *+' + days + ' hari*\n' +
        '  ◆  📅 Aktif s/d : *' + formatted + '*\n' +
        '  ◆  🕐 Waktu     : *' + (timeText || '-') + '*\n' +
        '  ◆  ⏳ Sisa      : *' + remainingDays + ' hari*\n\n' +
        '╭─────────────────────────────────────╮\n' +
        '│  💎  *BENEFIT AKTIF*\n' +
        '╰─────────────────────────────────────╯\n\n' +
        '  ◆  🅟 Semua fitur download\n' +
        '  ◆  🅛 Limit harian: *' + (P.dailyLimit || 100) + '*\n' +
        '  ◆  💰 Daily x' + (P.dailyMoneyMultiplier || 2) + '\n' +
        '  ◆  ⭐ EXP x' + (P.expMultiplier || 2) + '\n' +
        '  ◆  🛒 Diskon shop ' + (P.shopDiscount || 0) + '%\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '  👑 _By owner: ' + config.ownerName + '_\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      mentions: [target],
    }, { quoted: msg });

    // Notifikasi ke user target
    try {
      await sock.sendMessage(target, {
        text:
          '🎉 *PREMIUM AKTIF!*\n\n' +
          'Selamat! Kamu baru saja mendapat *premium* 🅟\n\n' +
          '  ◆  ⏱️ Durasi  : *' + days + ' hari*\n' +
          '  ◆  📅 Aktif s/d: *' + formatted + '*\n' +
          '  ◆  🕐 Waktu   : *' + (timeText || '-') + '*\n\n' +
          '💎 Nikmati semua fitur premium:\n' +
          '  • Download tanpa limit\n' +
          '  • Limit harian ' + (P.dailyLimit || 100) + '\n' +
          '  • Bonus daily & EXP 2x\n' +
          '  • Diskon shop ' + (P.shopDiscount || 0) + '%\n\n' +
          'Cek status: *' + config.prefix + 'premium cek*\n\n' +
          '_' + config.botName + '_',
      });
    } catch (e) {
      console.error('❌ Gagal notif target: ' + e.message);
    }
  },
};