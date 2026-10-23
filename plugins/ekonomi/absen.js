module.exports = {
  name: 'absen',
  command: ['absen', 'streak', 'checkin'],
  aliases: ['streak', 'checkin'],
  category: 'ekonomi',
  tags: ['ekonomi'],
  help: ['absen', 'streak'],
  description: 'Absen harian beruntun (Daily Streak) dengan bonus uang & exp berlipat ganda',
  async execute(ctx) {
    const user = ctx.user || (ctx.db && ctx.db.getUser && ctx.db.getUser(ctx.sender)) || {};
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const lastCheckin = user.lastCheckin || 0;

    if (now - lastCheckin < DAY_MS) {
      const remainingHours = Math.ceil((DAY_MS - (now - lastCheckin)) / (60 * 60 * 1000));
      return ctx.reply(
        `⏳ *Kamu sudah absen hari ini!*\n` +
        `🔥 Streak saat ini: *${user.streakCount || 1} Hari*\n` +
        `Silakan kembali lagi dalam *${remainingHours} jam*.`
      );
    }

    const isConsecutive = now - lastCheckin < DAY_MS * 2;
    user.streakCount = isConsecutive ? (user.streakCount || 0) + 1 : 1;
    user.lastCheckin = now;

    const bonusMoney = Math.min(25000, 1500 + user.streakCount * 500);
    const bonusExp = Math.min(2500, 150 + user.streakCount * 50);

    user.money = (user.money || 0) + bonusMoney;
    user.exp = (user.exp || 0) + bonusExp;

    if (ctx.db && typeof ctx.db.save === 'function') {
      await ctx.db.save();
    }

    return ctx.reply(
      `✅ *ABSEN HARIAN BERHASIL!*\n\n` +
      `🔥 Streak Beruntun: *${user.streakCount} Hari*\n` +
      `💰 Bonus Uang: *+Rp ${bonusMoney.toLocaleString('id-ID')}*\n` +
      `✨ Bonus EXP: *+${bonusExp} EXP*\n\n` +
      `_Pertahankan absen setiap hari agar bonus makin besar!_`
    );
  }
};
module.exports.handler = module.exports.execute;
