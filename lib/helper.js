// lib/helper.js
const fs = require('fs');
const path = require('path');
const config = require('../config');

// ============================================================
//   SPAM TRACKER
// ============================================================
const spamTracker = {};

// 🆕 Path file multi-owner
const OWNERS_PATH = path.join(__dirname, '..', 'database', 'owners.json');

// 🆕 Cache owners (5 detik)
let _ownersCache = { data: null, time: 0 };

function loadExtraOwners() {
  const now = Date.now();
  if (_ownersCache.data && now - _ownersCache.time < 5000) return _ownersCache.data;
  try {
    if (!fs.existsSync(OWNERS_PATH)) {
      _ownersCache = { data: [], time: now };
      return [];
    }
    const raw = fs.readFileSync(OWNERS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    _ownersCache = { data: Array.isArray(data) ? data : [], time: now };
    return _ownersCache.data;
  } catch (e) {
    console.error('⚠️ loadExtraOwners error:', e.message);
    return _ownersCache.data || [];
  }
}

function reloadOwners() {
  _ownersCache = { data: null, time: 0 };
}

// Cleanup spam tracker tiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const jid in spamTracker) {
    const u = spamTracker[jid];
    if (u.lastActivity && now - u.lastActivity > 30 * 60 * 1000 && u.mutedUntil < now) {
      delete spamTracker[jid];
    }
  }
}, 5 * 60 * 1000).unref();

// ============================================================
//   UTIL DASAR
// ============================================================
function cleanNumber(str) {
  return String(str || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function isGroup(jid) {
  return String(jid || '').endsWith('@g.us');
}

function random(arr) {
  if (!Array.isArray(arr) || !arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatMoney(a) {
  const n = Number(a);
  if (!Number.isFinite(n)) return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getPhoneFromJid(jid) {
  if (!jid) return '';
  const n = cleanNumber(jid);
  return n ? '+' + n : '';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isUrl(text) {
  if (!text) return false;
  return /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/i.test(text);
}

// ============================================================
//   OWNER CHECK (MULTI-OWNER SUPPORT)
// ============================================================
function isOwner(jid) {
  if (!jid) return false;
  const n = cleanNumber(jid);
  const ownerNum = cleanNumber(config.ownerNumber);
  const ownerLID = cleanNumber(config.ownerLID);

  // Cek owner utama dari config
  if (ownerNum && n === ownerNum) return true;
  if (ownerLID && n === ownerLID) return true;

  // Cek extra owners dari file
  const extras = loadExtraOwners();
  for (const o of extras) {
    const on = cleanNumber(o.jid || o);
    if (on && n === on) return true;
  }

  return false;
}

function isSenderOwner(msg, sender) {
  const cleanOwner = cleanNumber(config.ownerNumber);
  const ownerLID = cleanNumber(config.ownerLID);

  const fields = [
    sender,
    msg?.key?.participant,
    msg?.key?.participantAlt,
    msg?.key?.participantPn,
    msg?.key?.remoteJid,
    msg?.key?.remoteJidAlt,
    msg?.key?.senderPn,
  ].filter(Boolean);

  // Kumpulkan semua owner number (config + extras)
  const ownerNums = new Set();
  if (cleanOwner) ownerNums.add(cleanOwner);
  if (ownerLID) ownerNums.add(ownerLID);

  const extras = loadExtraOwners();
  for (const o of extras) {
    const on = cleanNumber(o.jid || o);
    if (on) ownerNums.add(on);
  }

  for (const f of fields) {
    const clean = cleanNumber(f);
    if (ownerNums.has(clean)) return true;
  }

  return false;
}

// ============================================================
//   MESSAGE HELPERS
// ============================================================
function getQuoted(msg) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo
    || msg?.message?.imageMessage?.contextInfo
    || msg?.message?.videoMessage?.contextInfo
    || null;
  if (!ctx?.quotedMessage) return null;
  return {
    message: ctx.quotedMessage,
    key: {
      remoteJid: msg.key.remoteJid,
      fromMe: false,
      id: ctx.stanzaId,
      participant: ctx.participant,
    },
    sender: ctx.participant,
    senderNumber: cleanNumber(ctx.participant),
  };
}

function getTarget(msg, args = []) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo || null;
  const mentions = ctx?.mentionedJid || [];
  if (mentions.length) return mentions[0];

  const quoted = getQuoted(msg);
  if (quoted?.sender) return quoted.sender;

  if (args[0] && /^[0-9+\-\s]+$/.test(args[0])) {
    let num = cleanNumber(args[0]);
    if (num.startsWith('0')) num = '62' + num.slice(1);
    return num + '@s.whatsapp.net';
  }

  return null;
}

// ============================================================
//   WHITELIST
// ============================================================
function isGroupAllowed(jid) {
  if (!config.whitelistGroup?.enabled) return true;
  const list = config.whitelistGroup.groups || [];
  if (!list.length) return true;
  return list.includes(jid);
}

// ============================================================
//   ANTI-SPAM
// ============================================================
function checkSpam(senderJid) {
  if (!config.antiSpam) return { spam: false };

  const now = Date.now();
  let u = spamTracker[senderJid];
  if (!u) {
    u = { count: 0, firstMsg: now, warned: 0, mutedUntil: 0, notified: 0, lastActivity: now };
    spamTracker[senderJid] = u;
  }
  u.lastActivity = now;

  if (u.mutedUntil > now) {
    return { spam: true, muted: true, sisa: Math.ceil((u.mutedUntil - now) / 1000) };
  }

  if (now - u.firstMsg > config.spamInterval) {
    u.count = 0;
    u.firstMsg = now;
    u.warned = 0;
  }

  u.count++;

  if (u.count > config.spamLimit) {
    u.warned++;
    if (u.warned >= config.warningBeforeMute) {
      u.mutedUntil = now + config.spamMuteDuration;
      return { spam: true, muted: true, sisa: Math.ceil(config.spamMuteDuration / 1000) };
    }
    return { spam: true, muted: false, warned: u.warned };
  }

  return { spam: false };
}

// ============================================================
//   EXPORT
// ============================================================
module.exports = {
  // Owner
  isOwner,
  isSenderOwner,
  loadExtraOwners,      // 🆕
  reloadOwners,         // 🆕
  OWNERS_PATH,          // 🆕

  // Util dasar
  isGroup,
  random,
  formatMoney,
  cleanNumber,
  getPhoneFromJid,
  sleep,
  isUrl,

  // Message helpers
  getQuoted,
  getTarget,

  // Whitelist
  isGroupAllowed,

  // Anti-spam
  checkSpam,
  spamTracker,
};