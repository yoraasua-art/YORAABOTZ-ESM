// Penjaga grup: peringatan (warn), anti-toxic, anti-delete, dan pelacak aktivitas (sider).
const fs = require('fs');
const path = require('path');
const { digits } = require('./group-utils');

const DEFAULT_WARN_LIMIT = 3;
const DEFAULT_TOXIC_WORDS = [
  'anjing', 'anjir', 'bangsat', 'babi', 'kontol', 'memek', 'ngentot', 'entot', 'goblok', 'goblog', 'tolol',
  'bajingan', 'keparat', 'asu', 'jancok', 'jancuk', 'cok', 'kampret', 'idiot', 'pepek', 'peler', 'tai',
  'kimak', 'pantek', 'brengsek', 'bego',
];

// ───────────── WARN ─────────────
function warnLimit(config) {
  const value = Number(config?.groupWarnLimit);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_WARN_LIMIT;
}

function getWarns(getGroupSettings, groupId, jid) {
  return Number(getGroupSettings(groupId).warns?.[digits(jid)]) || 0;
}

function setWarns(getGroupSettings, updateGroupSettings, groupId, jid, count) {
  const warns = { ...(getGroupSettings(groupId).warns || {}) };
  if (count > 0) warns[digits(jid)] = count;
  else delete warns[digits(jid)];
  updateGroupSettings(groupId, { warns });
  return count;
}

function addWarn(getGroupSettings, updateGroupSettings, groupId, jid) {
  return setWarns(getGroupSettings, updateGroupSettings, groupId, jid, getWarns(getGroupSettings, groupId, jid) + 1);
}

async function applyWarn(sock, ctx, roles, target, reason) {
  const { from, config, getGroupSettings, updateGroupSettings } = ctx;
  const limit = warnLimit(config);
  const count = addWarn(getGroupSettings, updateGroupSettings, from, target);
  const tag = `@${digits(target)}`;
  if (count < limit) {
    await sock.sendMessage(from, {
      text: `⚠️ *PERINGATAN ${count}/${limit}*\n\n${tag}${reason ? `\nAlasan: ${reason}` : ''}\n\nJika mencapai ${limit} peringatan, kamu akan dikeluarkan dari grup.`,
      mentions: [target],
    });
    return { count, kicked: false };
  }
  setWarns(getGroupSettings, updateGroupSettings, from, target, 0);
  if (!roles.botIsAdmin) {
    await sock.sendMessage(from, { text: `⛔ ${tag} sudah mencapai ${limit} peringatan, tetapi bot bukan admin sehingga tidak bisa mengeluarkan.`, mentions: [target] });
    return { count, kicked: false };
  }
  await sock.sendMessage(from, { text: `⛔ ${tag} mencapai ${limit} peringatan dan dikeluarkan dari grup.`, mentions: [target] });
  await sock.groupParticipantsUpdate(from, [target], 'remove');
  return { count, kicked: true };
}

// ───────────── ANTI-TOXIC ─────────────
function normalizeForFilter(text) {
  return String(text || '').toLowerCase()
    .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!]/g, 'i').replace(/0/g, 'o').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/[^a-z\s]/g, ' ');
}

function findToxicWord(text, extraWords = []) {
  const words = new Set(normalizeForFilter(text).split(/\s+/).filter(Boolean));
  const list = [...DEFAULT_TOXIC_WORDS, ...extraWords.map(word => normalizeForFilter(word).trim())].filter(Boolean);
  return list.find(word => words.has(word)) || null;
}

// ───────────── ANTI-DELETE ─────────────
const MESSAGE_TTL = 2 * 60 * 60 * 1000;
const MAX_CACHE = 1000;
const messageCache = new Map();

function cacheMessage(msg) {
  if (!msg?.key?.id || msg.message?.protocolMessage) return;
  messageCache.set(msg.key.id, { msg, at: Date.now() });
  if (messageCache.size > MAX_CACHE) messageCache.delete(messageCache.keys().next().value);
}

function getRevokedKey(msg) {
  const protocol = msg?.message?.protocolMessage;
  if (!protocol) return null;
  if (protocol.type !== 0 && protocol.type !== 'REVOKE') return null;
  return protocol.key || null;
}

function takeCachedMessage(id) {
  const entry = messageCache.get(id);
  if (!entry) return null;
  messageCache.delete(id);
  return Date.now() - entry.at <= MESSAGE_TTL ? entry.msg : null;
}

// ───────────── SIDER (aktivitas anggota) ─────────────
const ACTIVITY_PATH = path.join(__dirname, '..', 'database', 'group-activity.json');
let activity = null;
let saveTimer = null;

function loadActivity() {
  if (activity) return activity;
  try {
    activity = fs.existsSync(ACTIVITY_PATH) ? JSON.parse(fs.readFileSync(ACTIVITY_PATH, 'utf-8')) : {};
  } catch {
    activity = {};
  }
  return activity;
}

function flushActivity() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!activity) return;
  fs.mkdirSync(path.dirname(ACTIVITY_PATH), { recursive: true });
  const tmp = `${ACTIVITY_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(activity));
  fs.renameSync(tmp, ACTIVITY_PATH);
}

function recordActivity(groupId, jid, now = Date.now()) {
  const data = loadActivity();
  const group = data[groupId] || (data[groupId] = { since: now, members: {} });
  group.members[digits(jid)] = now;
  if (!saveTimer) {
    saveTimer = setTimeout(() => { try { flushActivity(); } catch (error) { console.error('Gagal simpan aktivitas grup:', error.message); } }, 10000);
    if (saveTimer.unref) saveTimer.unref();
  }
}

function getGroupActivity(groupId) {
  return loadActivity()[groupId] || null;
}

function resetActivityCache() {
  activity = null;
}

module.exports = {
  DEFAULT_WARN_LIMIT, DEFAULT_TOXIC_WORDS, warnLimit, getWarns, setWarns, addWarn, applyWarn,
  normalizeForFilter, findToxicWord,
  cacheMessage, getRevokedKey, takeCachedMessage, messageCache,
  recordActivity, getGroupActivity, flushActivity, resetActivityCache, ACTIVITY_PATH,
};
