// ============================================================
//   AFK — tandai diri sedang tidak aktif.
//   - .afk <alasan>      : mulai AFK
//   - kirim pesan lagi   : otomatis kembali (dan diumumkan)
//   - di-tag / di-reply  : bot memberi tahu bahwa orang itu sedang AFK
//
//   Data disimpan di users.json pada field `afk`:
//     { since: <ms>, reason: <teks>, ids: [<nomor/LID>, ...] }
// ============================================================

const DEFAULT_REASON = 'Tanpa alasan';
const MAX_REASON = 100;
const NOTICE_COOLDOWN_MS = 60 * 1000; // jangan spam pemberitahuan yang sama

const noticeTimes = new Map(); // `${group}|${afkKey}` -> timestamp

function digits(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function cleanReason(reason) {
  const text = String(reason || '').replace(/\s+/g, ' ').trim().slice(0, MAX_REASON);
  return text || DEFAULT_REASON;
}

function formatElapsed(ms) {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  if (totalMinutes < 1) return 'kurang dari 1 menit';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days} hari`);
  if (hours) parts.push(`${hours} jam`);
  if (minutes && !days) parts.push(`${minutes} menit`);
  return parts.join(' ');
}

// Indeks nomor -> kunci user supaya tiap pesan grup tidak perlu memindai seluruh database.
let indexedDb = null;
const index = new Map();

function indexEntry(key, afk) {
  index.set(digits(key), key);
  for (const id of afk?.ids || []) index.set(id, key);
}

function ensureIndex(db) {
  if (indexedDb === db) return;
  index.clear();
  for (const [key, user] of Object.entries(db)) {
    if (user?.afk) indexEntry(key, user.afk);
  }
  indexedDb = db;
}

/** Cari entri AFK milik `jid` (cocokkan lewat nomor/LID yang tersimpan). */
function findAfk(db, jid) {
  const wanted = digits(jid);
  if (!wanted) return null;
  ensureIndex(db);
  const key = index.get(wanted);
  if (!key) return null;
  const afk = db[key]?.afk;
  if (!afk) {
    index.delete(wanted);
    return null;
  }
  return { key, afk };
}

function setAfk({ updateUser }, key, identities, reason, now = Date.now()) {
  const ids = [...new Set((identities || []).map(digits).filter(Boolean))];
  const afk = { since: now, reason: cleanReason(reason), ids };
  updateUser(key, { afk });
  indexEntry(key, afk);
  return afk;
}

function clearAfk({ updateUser }, key) {
  updateUser(key, { afk: null });
  for (const [id, value] of index) {
    if (value === key) index.delete(id);
  }
}

function getContextInfo(message) {
  if (!message) return null;
  for (const value of Object.values(message)) {
    if (value && typeof value === 'object' && value.contextInfo) return value.contextInfo;
  }
  return null;
}

/**
 * Dipanggil untuk setiap pesan grup.
 * - sender kembali dari AFK -> hapus status + umumkan
 * - ada yang di-tag/di-reply sedang AFK -> beri tahu
 */
async function processAfkMessage(deps) {
  const { sock, msg, from, sender, text, prefix, loadDB, updateUser, now = Date.now() } = deps;
  const db = loadDB();

  // 1) Pengirim sedang AFK lalu bicara lagi -> kembali.
  const command = typeof text === 'string' && text.startsWith(prefix)
    ? text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
    : '';
  const isAfkCommand = command === 'afk' || command === 'brb';
  const own = findAfk(db, sender);
  if (own && !isAfkCommand) {
    clearAfk({ updateUser }, own.key);
    await sock.sendMessage(from, {
      text: `👋 *@${digits(sender)}* sudah kembali dari AFK!\n⏱️ AFK selama ${formatElapsed(now - own.afk.since)}\n📝 Alasan tadi: ${own.afk.reason}`,
      mentions: [sender],
    }, { quoted: msg });
  }

  // 2) Ada yang di-tag / di-reply yang sedang AFK.
  const info = getContextInfo(msg.message);
  if (!info) return;
  const targets = new Set([...(info.mentionedJid || []), info.participant].filter(Boolean));
  const lines = [];
  const mentions = [];
  for (const target of targets) {
    if (digits(target) === digits(sender)) continue;
    const found = findAfk(loadDB(), target);
    if (!found) continue;
    const noticeKey = `${from}|${found.key}`;
    if (now - (noticeTimes.get(noticeKey) || 0) < NOTICE_COOLDOWN_MS) continue;
    noticeTimes.set(noticeKey, now);
    mentions.push(target);
    lines.push(`💤 *@${digits(target)}* sedang AFK sejak ${formatElapsed(now - found.afk.since)} lalu.\n📝 Alasan: ${found.afk.reason}`);
  }
  if (lines.length) {
    await sock.sendMessage(from, { text: lines.join('\n\n'), mentions }, { quoted: msg });
  }
}

module.exports = {
  DEFAULT_REASON, MAX_REASON, digits, cleanReason, formatElapsed,
  findAfk, setAfk, clearAfk, getContextInfo, processAfkMessage, noticeTimes,
};
