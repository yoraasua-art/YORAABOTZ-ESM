const gameStats = require('../../lib/game-stats');

module.exports = {
  name: 'statgame',
  category: 'game',
  aliases: ['gamestats', 'statistikgame', 'mystats'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, getUser, config } = ctx;
    const target = ctx.mentioned?.[0] || sender;
    const stats = { ...gameStats.emptyStats(), ...(getUser(target).gameStats || {}) };
    const favorite = gameStats.favoriteGame(stats);
    const currentWeek = gameStats.weekKey(new Date(), config.autoBroadcast?.timezone);
    const weekWins = stats.week === currentWeek ? stats.weekWins : 0;
    const top = Object.entries(stats.byGame || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, wins]) => `• ${name}: ${wins}`).join('\n');
    await sock.sendMessage(from, {
      text: `📊 *STATISTIK GAME* @${String(target).split('@')[0]}\n\n🏆 Total menang: *${stats.wins}*\n📅 Menang minggu ini: *${weekWins}*\n` +
        `🔥 Streak harian: *${stats.streakDays} hari* (terbaik ${stats.bestStreak})\n⭐ Game favorit: *${favorite ? `${favorite[0]} (${favorite[1]}×)` : '-'}*` +
        `${top ? `\n\n🎮 *Top game*\n${top}` : ''}\n\n_Streak bertambah jika menang minimal 1 game setiap hari._`,
      mentions: [target],
    }, { quoted: msg });
  },
};
