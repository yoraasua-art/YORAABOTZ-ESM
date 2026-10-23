const gameStats = require('../../lib/game-stats');

module.exports = {
  name: 'topgame',
  category: 'game',
  aliases: ['topmingguan', 'leaderboardgame', 'lbgame'],
  async execute(sock, msg, args, ctx) {
    const { from, loadDB, getUser, updateUser, config, formatMoney } = ctx;
    const state = gameStats.getWeeklyState({ loadDB, getUser, updateUser, config }) || {};
    const week = state.week || gameStats.weekKey(new Date(), config.autoBroadcast?.timezone);
    const ranking = gameStats.weeklyRanking(loadDB(), week).slice(0, 10);
    const prizes = gameStats.prizesOf(config);
    const number = jid => String(jid).split('@')[0];
    const medals = ['🥇', '🥈', '🥉'];
    const lines = ranking.map((entry, index) => `${medals[index] || `${index + 1}.`} @${number(entry.jid)} — ${entry.wins} menang`);
    const last = (state.lastWinners || []).map((entry, index) => `${medals[index] || `${index + 1}.`} @${number(entry.jid)} — ${entry.wins} menang (+${formatMoney(entry.prize)})`);
    const mentions = [...ranking, ...(state.lastWinners || [])].map(entry => entry.jid);
    await sock.sendMessage(from, {
      text: `🏆 *LEADERBOARD GAME MINGGUAN* (${week})\n\n${lines.length ? lines.join('\n') : 'Belum ada pemenang minggu ini. Ayo main tebak-tebakan!'}\n\n` +
        `🎁 Hadiah otomatis tiap Senin: ${prizes.map((prize, index) => `#${index + 1} ${formatMoney(prize)}`).join(' · ')}` +
        `${last.length ? `\n\n📜 *Pemenang ${state.lastWeek}*\n${last.join('\n')}` : ''}`,
      mentions: [...new Set(mentions)],
    }, { quoted: msg });
  },
};
