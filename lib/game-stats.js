// Statistik game per user + leaderboard mingguan dengan hadiah otomatis.
// Per user (users.json → gameStats): wins, byGame, streakDays, bestStreak, lastWinDate, week, weekWins
// Global (database/weekly-game.json): minggu aktif & pemenang minggu lalu.
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'database', 'weekly-game.json');
const DEFAULT_PRIZES = [50000, 30000, 15000];
const DAY = 24 * 60 * 60 * 1000;

function zonedParts(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function dateKey(date = new Date(), timeZone = 'Asia/Jakarta') {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Minggu ISO-8601 (Senin awal minggu), contoh "2026-W40".
function weekKey(date = new Date(), timeZone = 'Asia/Jakarta') {
  const { year, month, day } = zonedParts(date, timeZone);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc - yearStart) / DAY + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function timezoneOf(config) {
  return config?.autoBroadcast?.timezone || 'Asia/Jakarta';
}

function prizesOf(config) {
  const prizes = config?.weeklyGame?.prizes;
  return Array.isArray(prizes) && prizes.length ? prizes.map(Number) : DEFAULT_PRIZES;
}

function readState(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch { /* file rusak → mulai ulang */ }
  return {};
}

function writeState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, file);
}

function weeklyRanking(db, week) {
  return Object.entries(db || {})
    .filter(([, user]) => user?.gameStats?.week === week && user.gameStats.weekWins > 0)
    .map(([jid, user]) => ({ jid, name: user.name, wins: user.gameStats.weekWins }))
    .sort((a, b) => b.wins - a.wins);
}

/** Tutup minggu lama: bagikan hadiah ke 3 besar lalu mulai minggu baru. */
function rolloverWeek(deps, now = new Date()) {
  const { loadDB, getUser, updateUser, config } = deps;
  if (typeof loadDB !== 'function') return null;
  const file = deps.weeklyPath || STATE_PATH;
  const current = weekKey(now, timezoneOf(config));
  const state = readState(file);
  if (state.week === current) return state;
  if (!state.week) {
    state.week = current;
    writeState(file, state);
    return state;
  }
  const prizes = prizesOf(config);
  const winners = weeklyRanking(loadDB(), state.week).slice(0, prizes.length).map((entry, index) => {
    const prize = prizes[index] || 0;
    const user = getUser(entry.jid);
    updateUser(entry.jid, { money: (Number(user.money) || 0) + prize });
    return { ...entry, prize };
  });
  const next = { week: current, lastWeek: state.week, lastWinners: winners, awardedAt: now.getTime() };
  writeState(file, next);
  return next;
}

function getWeeklyState(deps) {
  return rolloverWeek(deps) || readState(deps.weeklyPath || STATE_PATH);
}

function emptyStats() {
  return { wins: 0, byGame: {}, streakDays: 0, bestStreak: 0, lastWinDate: null, week: null, weekWins: 0 };
}

function recordWin(deps, jid, gameName, now = new Date()) {
  const { getUser, updateUser, config } = deps;
  if (typeof getUser !== 'function' || typeof updateUser !== 'function' || !jid) return null;
  try { rolloverWeek(deps, now); } catch (error) { console.error('Leaderboard mingguan:', error.message); }

  const timeZone = timezoneOf(config);
  const today = dateKey(now, timeZone);
  const yesterday = dateKey(new Date(now.getTime() - DAY), timeZone);
  const week = weekKey(now, timeZone);
  const stats = { ...emptyStats(), ...(getUser(jid).gameStats || {}) };
  stats.byGame = { ...(stats.byGame || {}) };

  stats.wins += 1;
  stats.byGame[gameName] = (stats.byGame[gameName] || 0) + 1;
  if (stats.lastWinDate !== today) {
    stats.streakDays = stats.lastWinDate === yesterday ? stats.streakDays + 1 : 1;
    stats.lastWinDate = today;
  }
  stats.bestStreak = Math.max(stats.bestStreak, stats.streakDays);
  stats.weekWins = stats.week === week ? stats.weekWins + 1 : 1;
  stats.week = week;
  updateUser(jid, { gameStats: stats });
  return stats;
}

function favoriteGame(stats) {
  const entries = Object.entries(stats?.byGame || {});
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

module.exports = {
  STATE_PATH, DEFAULT_PRIZES, dateKey, weekKey, weeklyRanking, rolloverWeek, getWeeklyState,
  recordWin, favoriteGame, emptyStats, prizesOf,
};
