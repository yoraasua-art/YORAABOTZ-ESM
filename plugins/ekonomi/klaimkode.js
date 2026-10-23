const REDEEM_CODES = {
  CAHYO2026: { money: 15000, exp: 500, limit: 10 },
  BOTGACOR: { money: 10000, exp: 350, limit: 5 },
  SMARTBOT: { money: 12000, exp: 400, limit: 8 },
  BERKAHSELALU: { money: 20000, exp: 750, limit: 12 }
};

module.exports = {
  name: 'klaimkode',
  category: 'ekonomi',
  aliases: ['redeem', 'kodepromo'],
  description: 'Klaim kode redeem hadiah',
  async execute(sock, msg, args, ctx) {
    const { from, sender, user, updateUser, formatMoney, config } = ctx;
    const code = ((args[0] || '')).trim().toUpperCase();

    if (!code) {
      return sock.sendMessage(from, {
        text: '🎁 *REDEEM KODE*\n\n' +
          'Cara pakai: *' + config.prefix + 'klaimkode <KODE>*\n\n' +
          'Kode aktif:\n' +
          '• `CAHYO2026`\n' +
          '• `BOTGACOR`\n' +
          '• `SMARTBOT`\n' +
          '• `BERKAHSELALU`',
      }, { quoted: msg });
    }

    const reward = REDEEM_CODES[code];
    if (!reward) {
      return sock.sendMessage(from, {
        text: '❌ Kode redeem tidak ditemukan atau sudah kedaluwarsa!',
      }, { quoted: msg });
    }

    const claimed = user.claimedCodes || [];
    if (claimed.includes(code)) {
      return sock.sendMessage(from, {
        text: '⚠️ Kamu sudah pernah mengklaim kode ini!',
      }, { quoted: msg });
    }

    claimed.push(code);

    updateUser(sender, {
      money: (user.money || 0) + reward.money,
      exp: (user.exp || 0) + reward.exp,
      limit: (user.limit || 0) + reward.limit,
      claimedCodes: claimed,
    });

    await sock.sendMessage(from, {
      text: '🎉 *REDEEM BERHASIL!* 🎉\n\n' +
        '🏷️ Kode: *' + code + '*\n' +
        '💰 Uang: *+' + formatMoney(reward.money) + '*\n' +
        '✨ EXP: *+' + reward.exp + '*\n' +
        '🎫 Limit: *+' + reward.limit + '*',
    }, { quoted: msg });
  }
};