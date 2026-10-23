// ============================================================
//   YORA BOTZ v8.0.2
//   Owner: Cahyo Store (08139525985)
//   Full patch: multi-owner, anti-viewonce, reconnect, dll
// ============================================================

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getContentType,
  downloadMediaMessage,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');
const config = require('./config');

// ============ LOAD LIB ============
const database = require('./lib/database');
const helper = require('./lib/helper');
const level = require('./lib/level');
const premiumLib = require('./lib/premium');
const { getCommandPolicy, isCommandText } = require('./lib/command-policy');
const { requiresRegister, getRegistrationCommand, sendRegisterRequired } = require('./lib/gate');
const { notifyOwner } = require('./lib/owner-notification');
const performanceStats = require('./lib/performance-stats');
const { startStorageMonitor, stopStorageMonitor } = require('./lib/storage-monitor');
const { startDatabaseBackup, stopDatabaseBackup } = require('./lib/database-backup');
const { getBannedUser, shouldNotifyBannedUser } = require('./lib/user-ban');
const { executeWithProcessingReaction } = require('./lib/processing-reaction');
const { handleTttInput } = require('./lib/ttt-game');
const { handleUnoInput } = require('./lib/uno-handler');
const { handleGameAnswer, formatDuration, SESSION_GAMES } = require('./lib/game-engine');
const { processAfkMessage } = require('./lib/afk');
const groupGuard = require('./lib/group-guard');
const { getGroupRoles, digits: jidDigits } = require('./lib/group-utils');
const { startSholatReminder } = require('./lib/sholat-reminder');
const pvp = require('./lib/pvp');
const { auditPlugins } = require('./lib/plugin-health');
const { VERSION } = require('./lib/version');

const getUser = database.getUser;
const updateUser = database.updateUser;
const loadDB = database.loadDB;
const saveDB = database.saveDB;
const loadGroups = database.loadGroups;
const saveGroups = database.saveGroups;
const getGroupSettings = database.getGroupSettings;
const updateGroupSettings = database.updateGroupSettings;
const loadMode = database.loadMode;
const saveMode = database.saveMode;

const isOwner = helper.isOwner;
const isSenderOwner = helper.isSenderOwner;
const isGroup = helper.isGroup;
const random = helper.random;
const formatMoney = helper.formatMoney;
const isGroupAllowed = helper.isGroupAllowed;
const checkSpam = helper.checkSpam;
const spamTracker = helper.spamTracker;

// ============ GROUP SECURITY TRACKERS ============
const securityTrackers = { flood: new Map(), raid: new Map() };
function securityFloodHit(groupId, sender, now = Date.now()) {
  const key = `${groupId}:${sender}`;
  const list = (securityTrackers.flood.get(key) || []).filter(t => now - t < 5000);
  list.push(now);
  securityTrackers.flood.set(key, list);
  return list.length;
}
function securityRaidHit(groupId, count, now = Date.now()) {
  const list = (securityTrackers.raid.get(groupId) || []).filter(t => now - t < 15000);
  for (let i = 0; i < count; i++) list.push(now);
  securityTrackers.raid.set(groupId, list);
  return list.length;
}
// 🆕 Multi-owner & helper tambahan
const getQuoted = helper.getQuoted;
const getTarget = helper.getTarget;
const cleanNumber = helper.cleanNumber;
const loadExtraOwners = helper.loadExtraOwners;
const reloadOwners = helper.reloadOwners;
const OWNERS_PATH = helper.OWNERS_PATH;

config.botMode = loadMode();

// ============ 🆕 BOT STATE (reconnect + pairing) ============
const BOT_STATE = {
  reconnectAttempts: 0,
  maxReconnect: 15,
  reconnectDelay: 5000,
  pairingRetries: 0,
  maxPairingRetries: 3,
  signalErrors: 0,
};

function isSignalSessionError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('bad mac') ||
    msg.includes('failed to decrypt message') ||
    msg.includes('sessioncipher') ||
    msg.includes('decryptwithsessions') ||
    msg.includes('signal protocol');
}

function sessionRecoveryHint() {
  console.warn('⚠️ Signal session bermasalah (Bad MAC/decrypt). Ini biasanya session lama/bertabrakan, bukan error plugin.');
  console.warn('   Jika berulang, hentikan instance bot lain lalu jalankan: npm run reset-session');
  console.warn('   Setelah reset, bot akan meminta pairing ulang.');
}

process.on('unhandledRejection', (err) => {
  if (isSignalSessionError(err)) {
    BOT_STATE.signalErrors++;
    sessionRecoveryHint();
    return;
  }
  console.error('❌ Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  if (isSignalSessionError(err)) {
    BOT_STATE.signalErrors++;
    sessionRecoveryHint();
    return;
  }
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

// ============ 🆕 ANTI-VIEWONCE CACHE ============
const viewOnceCache = new Map();
const VIEWONCE_TTL = 30 * 60 * 1000;

// ============ FOLDER ============
const folders = ['database', 'session', 'assets'];
folders.forEach(function(f) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ============ GAME STATE ============
const gameState = {};
const gameTimers = {};

function setGameTimeout(roomId, cb) {
  clearGameTimeout(roomId);
  gameTimers[roomId] = setTimeout(async function() {
    if (gameState[roomId]) {
      try { await cb(); } catch (e) {}
      delete gameState[roomId];
    }
    delete gameTimers[roomId];
  }, config.gameTimeout || 120000);
}

function clearGameTimeout(roomId) {
  if (gameTimers[roomId]) {
    clearTimeout(gameTimers[roomId]);
    delete gameTimers[roomId];
  }
}

// ============ LIMIT & PREMIUM HELPER ============
function getLimitCost(command) {
  const costs = config.limitCost || {};
  if (Object.prototype.hasOwnProperty.call(costs, command)) return costs[command];
  return costs.default !== undefined ? costs.default : 1;
}

function isPremiumCommand(command) {
  return premiumLib.isPremiumOnly(command);
}

const noLimitCommands = [
  'menu', 'help', 'start', 'menuall', 'allmenu', 'menugame', 'menugames', 'menufun', 'menuhiburan',
  'menuekonomi', 'menueco', 'menulevel', 'menugroup', 'menuadmin',
  'menuowner', 'menuown', 'menutools', 'menutool', 'menudownload', 'menudownloadmedia',
  'menumedia', 'menuislami', 'menuislam', 'menusticker', 'menuhd', 'menuupload',
  'menuqr', 'menuinfo', 'menuai', 'menuutilitas', 'providerstatus', 'provider', 'providerstat', 'dlproviderstatus', 'providerconfig', 'setprovider', 'dlproviderconfig', 'providerconf', 'menu',
  'runtime', 'uptime', 'rt', 'perf', 'performance', 'cleanup', 'clearcache', 'storage', 'diskusage',
  'profile', 'profil',
  'owner', 'ownerku', 'own', 'info', 'botinfo', 'ban', 'block', 'unban', 'unblock',
  'mode', 'botmode', 'self', 'public', 'ping',
  'tqto', 'thanks', 'credit', 'sc', 'fitur', 'features', 'commands',
  'daftar', 'register', 'reg', 'unreg', 'unregister',
  'limit', 'point', 'uang', 'money', 'daily', 'shop',
  'level', 'lvl', 'rank', 'peringkat', 'leaderboard', 'lb', 'top',
  'antilink', 'antispam', 'antimention', 'antiflood', 'antiraid', 'antiinvite', 'antisticker', 'antimedia', 'antiaudio', 'antifile', 'antiforward', 'securitystatus', 'mute', 'unmute', 'welcome', 'setwelcome', 'setgoodbye',
  'kick', 'promote', 'demote', 'tagall', 'groupinfo',
  'poll', 'afk', 'brb',
  'id', 'groupid', 'cekid',
  'addlimit', 'addmoney', 'addpoint', 'setlimit', 'setmoney', 'resetuser',
  'broadcast', 'backup', 'backupdb', 'restore', 'restoredb', 'restoreyes', 'restoreno',
  'getcfg', 'getconfig', 'setcfg', 'setconfig', 'reloadcfg', 'reloadconfig',
  'showconfig', 'showcfg', 'toggle', 'readfile', 'listfiles', 'ls',
  'savefile', 'sf', 'reloadplugins', 'reloadp', 'reload',
  'restartbot', 'restart', 'reboot', 'autobroadcast', 'ab', 'waktubc',
  'premium', 'prem', 'buypremium', 'addpremium', 'delpremium', 'listpremium', 'cekpremium',
  // 🆕 Multi-owner
  'addowner', 'delowner', 'listowner', 'owners',
  'nyerah', 'menyerah', 'giveup', 'skip',
];

// ============ LOAD PLUGINS ============
const plugins = new Map();
const pluginList = [];
let pluginLoadStatus = { loaded: 0, failed: 0, applied: false, failures: [] };

async function loadPlugins() {
  const dir = path.join(__dirname, 'plugins');
  if (!fs.existsSync(dir)) {
    console.log('⚠️ Folder plugins tidak ada');
    return { loaded: pluginList.length, failed: 1, applied: false };
  }

  const menuLayoutPath = require.resolve(path.join(__dirname, 'lib', 'menu-layout.js'));
  delete require.cache[menuLayoutPath];

  const cats = fs.readdirSync(dir).sort().filter(function(f) {
    return fs.statSync(path.join(dir, f)).isDirectory();
  });

  console.log('\n╔══════════════════════════════════╗');
  console.log('║      📦 PLUGINS BERHASIL DIMUAT    ║');
  console.log('╚══════════════════════════════════╝');

  const loadedPlugins = [];
  const nextPlugins = new Map();
  const nextPluginList = [];
  let failed = 0;
  const failures = [];
  for (const cat of cats) {
    const catPath = path.join(dir, cat);
    const files = fs.readdirSync(catPath).sort().filter(function(f) {
      return f.endsWith('.js') || f.endsWith('.mjs');
    });

    let count = 0;
    for (const file of files) {
      try {
        const fullPath = path.join(catPath, file);
        delete require.cache[require.resolve(fullPath)];
        const p = file.endsWith('.mjs')
          ? (await import(pathToFileURL(fullPath).href + '?reload=' + Date.now())).default
          : require(fullPath);
        if (!p || !p.name || typeof p.execute !== 'function') {
          failed++;
          const failure = { file: cat + '/' + file, error: 'metadata plugin tidak valid' };
          failures.push(failure);
          console.log('  ❌ ' + failure.file + ': ' + failure.error);
          continue;
        }
        p.category = p.category || cat;
        p.aliases = p.aliases || [];
        p.version = p.version || VERSION;
        p.description = p.description || `${p.name} command`;
        nextPluginList.push(p);
        loadedPlugins.push({ plugin: p, file: cat + '/' + file });
        count++;
      } catch (err) {
        failed++;
        const failure = { file: cat + '/' + file, error: err.message };
        failures.push(failure);
        console.log('  ❌ ' + failure.file + ': ' + failure.error);
      }
    }
    if (count > 0) {
      console.log('  📁 ' + cat.padEnd(10) + ' : ' + count + ' plugin');
    }
  }

  for (const { plugin, file } of loadedPlugins) {
    const name = plugin.name.toLowerCase();
    if (nextPlugins.has(name)) {
      failed++;
      console.error('  ❌ Nama command bentrok "' + name + '" di ' + file);
      continue;
    }
    nextPlugins.set(name, plugin);
  }

  for (const { plugin, file } of loadedPlugins) {
    const acceptedAliases = [];
    for (const alias of plugin.aliases) {
      const key = String(alias).toLowerCase();
      if (nextPlugins.has(key)) {
        const existing = nextPlugins.get(key);
        if (existing !== plugin) {
          console.error('  ⚠️ Alias "' + key + '" diabaikan (' + file + '), sudah dipakai command "' + existing.name + '"');
        }
        continue;
      }
      nextPlugins.set(key, plugin);
      acceptedAliases.push(alias);
    }
    plugin.aliases = acceptedAliases;
  }

  if (failed > 0 && pluginList.length > 0) {
    console.error('  ⚠️ Reload dibatalkan; daftar plugin aktif sebelumnya dipertahankan.');
    console.log('  📊 Total    : ' + pluginList.length + ' plugin aktif\n');
    pluginLoadStatus = { loaded: pluginList.length, failed: failed, applied: false, failures };
    return { loaded: pluginList.length, failed: failed, applied: false, failures };
  }

  const audit = auditPlugins(nextPluginList);
  if (!audit.ok) {
    for (const issue of audit.issues) console.error('  ⚠️ Plugin audit: ' + issue);
    if (pluginList.length > 0) {
      console.error('  ⚠️ Audit plugin gagal; daftar plugin aktif sebelumnya dipertahankan.');
      pluginLoadStatus = { loaded: pluginList.length, failed: failed + audit.issues.length, applied: false, failures, auditIssues: audit.issues };
      return { loaded: pluginList.length, failed: failed + audit.issues.length, applied: false, failures, auditIssues: audit.issues };
    }
  }

  plugins.clear();
  for (const [name, plugin] of nextPlugins) plugins.set(name, plugin);
  pluginList.splice(0, pluginList.length, ...nextPluginList);
  console.log('  📊 Total    : ' + pluginList.length + ' plugin\n');
  pluginLoadStatus = { loaded: pluginList.length, failed, applied: true, failures, auditIssues: audit.issues };
  return { loaded: pluginList.length, failed, applied: true, failures, auditIssues: audit.issues };
}

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

function findClosestCommand(input) {
  const keys = [...plugins.keys()];
  if (!keys.length) return [];
  const scored = keys.map((key) => ({ key, score: levenshteinDistance(input, key) })).filter((item) => item.score <= 3 || item.key.startsWith(input.slice(0, 2)));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 3).map((item) => item.key);
}

// ============ BUILD CONTEXT ============
function buildContext(sock, msg, args) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participantAlt || msg.key.participant || msg.key.remoteJidAlt || msg.key.remoteJid;
  const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
  const pushName = msg.pushName || 'User';
  const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const user = getUser(sender);

  const ctx = {
    config: config,
    version: VERSION,
    from: from,
    sender: sender,
    senderNumber: senderNumber,
    pushName: pushName,
    mentioned: mentioned,
    user: user,
    args: args,
    msg: msg,
    sock: sock,
    downloadMediaMessage: downloadMediaMessage,
    getUser: getUser,
    updateUser: updateUser,
    loadDB: loadDB,
    saveDB: saveDB,
    flushDatabase: database.flushDatabase,
    DB_PATH: path.join(__dirname, 'database', 'users.json'),
    GROUP_PATH: path.join(__dirname, 'database', 'groups.json'),
    MODE_PATH: path.join(__dirname, 'database', 'mode.json'),
    // 🆕 Multi-owner paths
    OWNERS_PATH: OWNERS_PATH,
    loadExtraOwners: loadExtraOwners,
    reloadOwners: reloadOwners,
    cleanNumber: cleanNumber,
    loadCommandStats: database.loadCommandStats,
    resetCommandStats: database.resetCommandStats,
    loadActivityLog: database.loadActivityLog,
    pushActivity: database.pushActivity,
    clearActivityLog: database.clearActivityLog,
    notifyOwner: function(text) {
      return notifyOwner(sock, config, text);
    },
    loadGroups: loadGroups,
    saveGroups: saveGroups,
    getGroupSettings: getGroupSettings,
    updateGroupSettings: updateGroupSettings,
    saveMode: saveMode,
    reloadDatabase: database.reloadDatabase,
    isOwner: isOwner,
    isSenderOwner: function() { return isSenderOwner(msg, sender); },
    isGroup: isGroup,
    isGroupAllowed: isGroupAllowed,
    random: random,
    formatMoney: formatMoney,
    checkSpam: checkSpam,
    spamTracker: spamTracker,
    // 🆕 Helper tambahan
    getQuoted: function() { return getQuoted(msg); },
    getTarget: function(a) { return getTarget(msg, a || args); },
    gameState: gameState,
    gameTimers: gameTimers,
    gameDurationText: formatDuration(config.gameTimeout || 120000),
    setGameTimeout: setGameTimeout,
    clearGameTimeout: clearGameTimeout,
    getLevelFromExp: level.getLevelFromExp,
    getExpForLevel: level.getExpForLevel,
    getExpProgress: level.getExpProgress,
    addExp: level.addExp,
    // Premium 🅟
    isPremium: function() { return premiumLib.isPremium(user); },
    premiumRemainingDays: function() { return premiumLib.premiumRemainingDays(user); },
    addPremium: premiumLib.addPremium,
    removePremium: premiumLib.removePremium,
    listPremium: premiumLib.listPremium,
    formatDate: premiumLib.formatDate,
    isPremiumOnly: premiumLib.isPremiumOnly,
    premiumLib: premiumLib,
    // Limit 🅛
    getLimitCost: getLimitCost,
    noLimit: noLimitCommands,
    pluginList: pluginList,
    pluginLoadStatus: pluginLoadStatus,
    reloadPlugins: loadPlugins,
  };

  return ctx;
}

// ============ ANTI-DELETE ============
async function resendDeletedMessage(sock, from, deleter, msg, revokedKey) {
  const original = groupGuard.takeCachedMessage(revokedKey.id);
  if (!original) return;
  const ownerIds = [original.key.participant, original.key.participantAlt].filter(Boolean).map(jidDigits);
  const deleterIds = [deleter, msg.key.participant, msg.key.participantAlt].filter(Boolean).map(jidDigits);
  if (!ownerIds.some(id => deleterIds.includes(id))) return;
  const author = original.key.participantAlt || original.key.participant;
  try {
    await sock.sendMessage(from, {
      text: '🗑️ *ANTI-DELETE*\n\n@' + jidDigits(author) + ' menghapus pesan berikut:',
      mentions: [author],
    });
    await sock.sendMessage(from, { forward: original });
  } catch (error) {
    console.error('❌ Anti-delete: ' + error.message);
  }
}

// ============ 🆕 ANTI-VIEWONCE ============
async function forwardViewOnce(sock, msg, from, sender) {
  if (!config.security?.antiViewOnce) return;
  try {
    const vo = msg.message.viewOnceMessage
      || msg.message.viewOnceMessageV2
      || msg.message.viewOnceMessageV2Extension;
    if (!vo) return;

    // Skip kalau dari owner sendiri
    if (isSenderOwner(msg, sender)) return;

    const cacheKey = msg.key.id;
    if (viewOnceCache.has(cacheKey)) return;

    const inner = vo.message;
    const mtype = getContentType(inner);
    const ownerJid = config.ownerNumber + '@s.whatsapp.net';

    try {
      const buf = await downloadMediaMessage(
        { ...msg, message: inner },
        'buffer', {},
        { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
      );
      if (!buf) return;

      const sendKey = mtype.replace('Message', '');
      await sock.sendMessage(ownerJid, {
        [sendKey]: buf,
        caption:
          '👁️ *ANTI-VIEWONCE*\n\n' +
          `👤 Dari: ${msg.pushName || 'User'} (@${sender.split('@')[0]})\n` +
          `📍 Chat: ${from.split('@')[0]}\n` +
          `🕐 Waktu: ${new Date().toLocaleString('id-ID')}`,
        mentions: [sender],
      });
    } catch (err) {
      console.error('❌ Anti-viewonce download: ' + err.message);
    }

    viewOnceCache.set(cacheKey, Date.now());
    if (viewOnceCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of viewOnceCache) {
        if (now - v > VIEWONCE_TTL) viewOnceCache.delete(k);
      }
    }
  } catch (error) {
    console.error('❌ Anti-viewonce: ' + error.message);
  }
}

// ============ START BOT ============
async function startBot() {
  require('./lib/license-guard').assertProductName(config.botName);
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  console.log('📡 Baileys version: ' + version.join('.'));

  const sock = makeWASocket({
    version: version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async function() { return { conversation: '' }; },
  });

  sock.ev.on('creds.update', saveCreds);

  // ==================== CONNECTION UPDATE ====================
  sock.ev.on('connection.update', async function(update) {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;
    const qr = update.qr;

    // 🆕 PAIRING RETRY
    if (qr && !sock.authState.creds.registered && BOT_STATE.pairingRetries < BOT_STATE.maxPairingRetries) {
      BOT_STATE.pairingRetries++;

      console.log('\n╔══════════════════════════════════╗');
      console.log('║   🔐 PAIRING CODE BOT            ║');
      console.log('╚══════════════════════════════════╝\n');

      let phone = String(config.botNumber || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '62' + phone.slice(1);

      if (phone.length < 10 || phone.length > 15) {
        console.log('❌ Nomor bot tidak valid di config.js!');
        process.exit(1);
      }

      console.log('📞 Nomor bot: ' + phone);
      console.log('⏳ Tunggu 5 detik...\n');

      setTimeout(async function() {
        try {
          const code = await sock.requestPairingCode(phone);
          const fmt = code.match(/.{1,4}/g)?.join('-') || code;

          console.log('\n╔══════════════════════════════════╗');
          console.log('║   ✅ PAIRING CODE BERHASIL        ║');
          console.log('╚══════════════════════════════════╝');
          console.log('\n   📱 Nomor: ' + phone);
          console.log('   🔑 Kode : ' + fmt + '\n');
          console.log('══════════════════════════════════');
          console.log('📌 CARA PAKAI:');
          console.log('   1. Buka WhatsApp di HP nomor bot');
          console.log('   2. Pengaturan → Perangkat Tertaut');
          console.log('   3. Tautkan Perangkat');
          console.log('   4. Pilih "Tautkan dengan nomor telepon saja"');
          console.log('   5. Masukkan kode: ' + fmt);
          console.log('   ⏱️ Kode berlaku 60 detik\n');
        } catch (e) {
          console.log('❌ Gagal pairing (' + BOT_STATE.pairingRetries + '/' + BOT_STATE.maxPairingRetries + '): ' + e.message);
        }
      }, 5000);
    }

    if (connection === 'close') {
      try { require('./lib/autobroadcast').stopAutoBroadcast(); } catch (e) {}
      stopStorageMonitor();
      stopDatabaseBackup();
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        const sp = path.join(__dirname, config.sessionName);
        if (fs.existsSync(sp)) fs.rmSync(sp, { recursive: true, force: true });
        try {
          await database.flushDatabase();
          try { groupGuard.flushActivity(); } catch (e) {}
        } catch (err) {
          console.error('❌ Gagal menyimpan database: ' + err.message);
        }
        console.log('🚪 Logged out. Restart manual untuk pairing ulang.');
        process.exit(0);
      }

      if (code === DisconnectReason.restartRequired) {
        console.log('🔁 Restart required...');
        return startBot();
      }

      // 🆕 RECONNECT LIMITER
      BOT_STATE.reconnectAttempts++;
      if (BOT_STATE.reconnectAttempts > BOT_STATE.maxReconnect) {
        console.error('❌ Terlalu banyak percobaan reconnect (' + BOT_STATE.maxReconnect + '×). Berhenti.');
        process.exit(1);
      }

      const delay = Math.min(BOT_STATE.reconnectDelay * BOT_STATE.reconnectAttempts, 60000);
      console.log(`🔄 Reconnect ${BOT_STATE.reconnectAttempts}/${BOT_STATE.maxReconnect} dalam ${delay/1000}s (code ${code})...`);
      setTimeout(function() { startBot(); }, delay);

    } else if (connection === 'open') {
      // 🆕 RESET STATE
      BOT_STATE.reconnectAttempts = 0;
      BOT_STATE.pairingRetries = 0;

      console.log('\n╔══════════════════════════════════╗');
      console.log('║   ✅ BOT BERHASIL TERHUBUNG!      ║');
      console.log('╚══════════════════════════════════╝');
      console.log('🤖 ' + config.botName);
      console.log('📞 ' + config.botNumber);
      console.log('📌 Mode: ' + config.botMode.toUpperCase());
      console.log('📦 Plugins: ' + pluginList.length + '\n');

      try {
        const autobc = require('./lib/autobroadcast');
        autobc.startAutoBroadcast(sock);
      } catch (e) {
        console.log('⚠️ Auto broadcast tidak aktif: ' + e.message);
      }
      startSholatReminder(sock);
      startStorageMonitor(sock, config);
      startDatabaseBackup({ sock, config, botName: config.botName, flushDatabase: database.flushDatabase });
    }
  });

  // ==================== GROUP EVENTS ====================
  sock.ev.on('group-participants.update', async function(update) {
    try {
      const id = update.id;
      const participants = update.participants;
      const action = update.action;

      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botAdded = participants.some(function(p) { return p === botJid; });

      if (action === 'add' && botAdded && !isGroupAllowed(id)) {
        let name = 'Grup';
        try {
          const meta = await sock.groupMetadata(id);
          name = meta.subject;
        } catch (e) {}

        try {
          await sock.sendMessage(id, {
            text: '❌ Bot hanya untuk grup resmi.\n\nOwner: ' + config.ownerNumber + '\n\nBot keluar dalam 5 detik...',
          });
          await new Promise(function(r) { setTimeout(r, 5000); });
        } catch (e) {}

        try { await sock.groupLeave(id); } catch (e) {}

        try {
          await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', {
            text: '🔔 Bot keluar dari grup non-whitelist:\n' + name + '\nID: ' + id,
          });
        } catch (e) {}
        return;
      }

      const gs = getGroupSettings(id);
      if (action === 'add' && gs.antiraid && participants.length > 0) {
        const joins = securityRaidHit(id, participants.length);
        if (joins >= 4) {
          try {
            const meta = await sock.groupMetadata(id);
            const botParticipant = meta.participants.find(p => [sock.user.id, sock.user.lid].filter(Boolean).some(x => jidDigits(x) === jidDigits(p.id)));
            if (botParticipant?.admin) {
              const targets = participants.filter(p => p !== botJid && p !== sock.user.id);
              if (targets.length) await sock.sendMessage(id, { text: `🚨 *ANTI-RAID*\n\nTerdeteksi ${joins} join dalam waktu singkat.`, mentions: targets });
            }
          } catch (e) { console.error('Anti-raid:', e.message); }
        }
      }
      let groupName = '';
      try {
        const meta = await sock.groupMetadata(id);
        groupName = meta.subject;
      } catch (e) {
        return;
      }

      for (const p of participants) {
        if (p === botJid) continue;
        const num = p.split('@')[0];

        if (action === 'add' && gs.welcome) {
          const t = gs.welcomeText.replace('@user', '@' + num).replace('@group', groupName);
          await sock.sendMessage(id, { text: '👋 *WELCOME*\n\n' + t, mentions: [p] });
        } else if (action === 'remove' && gs.welcome) {
          const t = gs.goodbyeText.replace('@user', '@' + num).replace('@group', groupName);
          await sock.sendMessage(id, { text: '👋 *GOODBYE*\n\n' + t, mentions: [p] });
        }
      }
    } catch (e) {
      console.error('Group event: ' + e.message);
    }
  });

  // ==================== MESSAGES ====================
  sock.ev.on('messages.upsert', async function(m) {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;
      if (msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      if (!from) return;

      // 🆕 IGNORE STATUS BROADCAST & NEWSLETTER
      if (from === 'status@broadcast'
        || from.endsWith('@newsletter')
        || from.endsWith('@broadcast')) {
        return;
      }

      const sender = msg.key.participantAlt || msg.key.participant || msg.key.remoteJidAlt || msg.key.remoteJid;
      const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');
      const pushName = msg.pushName || 'User';
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const type = getContentType(msg.message);

      // SELF MODE
      if (config.botMode === 'self' && !isSenderOwner(msg, sender)) return;

      // 🆕 ANTI-VIEWONCE
      if (isGroup(from) || from.endsWith('@s.whatsapp.net')) {
        await forwardViewOnce(sock, msg, from, sender);
      }

      // ANTI-DELETE & PELACAK AKTIVITAS
      if (isGroup(from)) {
        const guardSettings = getGroupSettings(from);
        const revokedKey = groupGuard.getRevokedKey(msg);
        if (revokedKey) {
          if (guardSettings.antidelete) await resendDeletedMessage(sock, from, sender, msg, revokedKey);
          return;
        }
        groupGuard.recordActivity(from, sender);
        if (guardSettings.antidelete) groupGuard.cacheMessage(msg);
      }

      // GROUP SECURITY COMMANDS / ENFORCEMENT
      if (isGroup(from)) {
        const gs = getGroupSettings(from);
        let roles = null;
        const getRoles = async () => roles || (roles = await getGroupRoles(sock, from, sender));
        const senderIsAdmin = async () => (await getRoles()).senderIsAdmin || isSenderOwner(msg, sender);

        // Anti-Flood: non-admin sends 5+ messages within 5 seconds.
        if (gs.antiflood && !isSenderOwner(msg, sender) && !(await senderIsAdmin())) {
          const hits = securityFloodHit(from, sender);
          if (hits >= 5) {
            try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
            if (hits === 5) {
              await sock.sendMessage(from, { text: `🌊 *ANTI-FLOOD*\n\n@${senderNumber} mengirim terlalu banyak pesan dalam waktu singkat.`, mentions: [sender] });
            }
            return;
          }
        }

        // Anti-Mention: block mass mentions from regular members.
        const mentionCount = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length || 0;
        if (gs.antimention && mentionCount >= 5 && !isSenderOwner(msg, sender) && !(await senderIsAdmin())) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
          await sock.sendMessage(from, { text: `📣 *ANTI-MENTION*\n\n@${senderNumber} mengirim ${mentionCount} mention sekaligus.`, mentions: [sender] });
          return;
        }

        // Anti-Invite: group invite / wa.me links specifically.
        let rawText = '';
        if (type === 'conversation') rawText = msg.message.conversation || '';
        else if (type === 'extendedTextMessage') rawText = msg.message.extendedTextMessage.text || '';
        else if (type === 'imageMessage') rawText = msg.message.imageMessage.caption || '';
        else if (type === 'videoMessage') rawText = msg.message.videoMessage.caption || '';
        const inviteRe = /(chat\.whatsapp\.com\/[A-Za-z0-9]+|wa\.me\/[0-9+]+)/i;
        if (gs.antiinvite && inviteRe.test(rawText) && !isSenderOwner(msg, sender) && !(await senderIsAdmin())) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
          await sock.sendMessage(from, { text: `🔗 *ANTI-INVITE*\n\n@${senderNumber} mengirim link undangan.`, mentions: [sender] });
          return;
        }

        // Anti-Forward: remove messages carrying WhatsApp forward metadata.
        const ci = msg.message.extendedTextMessage?.contextInfo || msg.message.imageMessage?.contextInfo || msg.message.videoMessage?.contextInfo || msg.message.documentMessage?.contextInfo || {};
        const forwarded = Boolean(ci.isForwarded || Number(ci.forwardingScore) > 0);
        if (gs.antiforward && forwarded && !isSenderOwner(msg, sender) && !(await senderIsAdmin())) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
          await sock.sendMessage(from, { text: `↪️ *ANTI-FORWARD*\n\nPesan forward dari @${senderNumber} dihapus.`, mentions: [sender] });
          return;
        }

        // Media restrictions.
        const isSticker = type === 'stickerMessage';
        const isMedia = type === 'imageMessage' || type === 'videoMessage';
        const isAudio = type === 'audioMessage';
        const isFile = type === 'documentMessage' || type === 'documentWithCaptionMessage';
        const blockedType = (gs.antisticker && isSticker) || (gs.antimedia && isMedia) || (gs.antiaudio && isAudio) || (gs.antifile && isFile);
        if (blockedType && !isSenderOwner(msg, sender) && !(await senderIsAdmin())) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
          const label = isSticker ? 'sticker' : isMedia ? 'foto/video' : isAudio ? 'audio' : 'file/dokumen';
          await sock.sendMessage(from, { text: `🚫 *SECURITY*\n\nJenis pesan *${label}* dari @${senderNumber} tidak diizinkan di grup ini.`, mentions: [sender] });
          return;
        }
      }

      // ANTI-LINK
      if (isGroup(from)) {
        const gs = getGroupSettings(from);
        if (gs.antilink) {
          let textCek = '';
          if (type === 'conversation') textCek = msg.message.conversation;
          else if (type === 'extendedTextMessage') textCek = msg.message.extendedTextMessage.text || '';

          const linkRe = /(https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/gi;
          if (textCek && linkRe.test(textCek)) {
            const gm = await sock.groupMetadata(from);
            const isAdmin = gm.participants.find(function(p) { return p.id === sender; })?.admin;
            if (!isAdmin && !isSenderOwner(msg, sender)) {
              try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
              await sock.sendMessage(from, {
                text: '⚠️ *ANTI-LINK*\n\n@' + senderNumber + ' mengirim link!',
                mentions: [sender],
              });
              return;
            }
          }
        }
      }

      // AMBIL TEXT
      let text = '';
      if (type === 'conversation') text = msg.message.conversation;
      else if (type === 'extendedTextMessage') text = msg.message.extendedTextMessage.text;
      else if (type === 'imageMessage') text = msg.message.imageMessage.caption || '';
      else if (type === 'videoMessage') text = msg.message.videoMessage.caption || '';

      const ownerSender = isSenderOwner(msg, sender);
      const bannedUser = getBannedUser(loadDB(), [
        sender,
        msg.key.participant,
        msg.key.participantAlt,
        msg.key.participantPn,
        msg.key.remoteJidAlt,
        msg.key.senderPn,
        `${senderNumber}@s.whatsapp.net`,
      ]);
      if (bannedUser && !ownerSender) {
        if (isCommandText(text, config.prefix) && shouldNotifyBannedUser(sender)) {
          try {
            await sock.sendMessage(sender, {
              text: `🚫 Akun kamu diblokir dari penggunaan bot.\nAlasan: ${bannedUser.banReason || 'Tidak mematuhi aturan bot.'}\n\nUntuk banding/unban, hubungi owner: https://wa.me/${config.ownerNumber}`,
            });
          } catch (error) {
            console.error('Gagal mengirim pemberitahuan ban:', error.message);
          }
        }
        return;
      }

      if (isGroup(from) && !ownerSender) {
        const muteState = spamTracker[sender];
        const now = Date.now();
        if (muteState?.manualMutedUntil > now) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (error) {
            console.error('Gagal menghapus pesan user yang dimute:', error.message);
          }
          if (!muteState.manualMuteNotifiedAt || now - muteState.manualMuteNotifiedAt > 60_000) {
            muteState.manualMuteNotifiedAt = now;
            await sock.sendMessage(from, {
              text: '🔇 Pesan @' + senderNumber + ' dihapus karena masih dalam masa mute.',
              mentions: [sender],
            });
          }
          return;
        }
        if (muteState?.manualMutedUntil) {
          muteState.manualMutedUntil = 0;
          muteState.manualMuteNotifiedAt = 0;
        }
      }

      // ANTI-TOXIC
      if (isGroup(from) && !ownerSender && text) {
        const toxicSettings = getGroupSettings(from);
        if (toxicSettings.antitoxic && groupGuard.findToxicWord(text, toxicSettings.toxicWords || [])) {
          try {
            const roles = await getGroupRoles(sock, from, sender);
            if (!roles.senderIsAdmin) {
              if (roles.botIsAdmin) {
                try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
              }
              const target = roles.senderParticipant?.id || sender;
              await groupGuard.applyWarn(sock, { from, config, getGroupSettings, updateGroupSettings }, roles, target, 'Menggunakan kata kasar (anti-toxic)');
              return;
            }
          } catch (toxicError) {
            console.error('❌ Anti-toxic: ' + toxicError.message);
          }
        }
      }

      // AFK
      if (isGroup(from)) {
        try {
          await processAfkMessage({
            sock, msg, from, sender, text, prefix: config.prefix, loadDB, updateUser,
          });
        } catch (afkError) {
          console.error('❌ AFK handler: ' + afkError.message);
        }
      }

      if (!text) return;

      // Anti-spam
      if (isCommandText(text, config.prefix) && isGroup(from) && !ownerSender) {
        const sc = checkSpam(sender);
        if (sc.spam) {
          try { await sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
          if (sc.muted) {
            if (!spamTracker[sender]?.notified || Date.now() - spamTracker[sender].notified > 30000) {
              spamTracker[sender].notified = Date.now();
              await sock.sendMessage(from, {
                text: '🚫 *ANTI-SPAM*\n\n@' + senderNumber + ' di-mute ' + sc.sisa + ' detik!',
                mentions: [sender],
              });
            }
          } else {
            await sock.sendMessage(from, {
              text: '⚠️ *PERINGATAN* (' + sc.warned + '/' + config.warningBeforeMute + ')\n\n@' + senderNumber + ', jangan spam command!',
              mentions: [sender],
            });
          }
          return;
        }
      }

      const registrationCommand = getRegistrationCommand(text, config.prefix);
      if (
        registrationCommand !== null &&
        requiresRegister(registrationCommand) &&
        !getUser(sender).registered &&
        !isSenderOwner(msg, sender)
      ) {
        await sendRegisterRequired(sock, from, config);
        return;
      }

      // PvP
      if (!isCommandText(text, config.prefix)) {
        const pvpContext = buildContext(sock, msg, []);
        if (await pvp.handlePvpText(sock, msg, pvpContext, text)) return;
      }

      // TTT
      if (gameState[from]?.game === 'ttt-pending' || gameState[from]?.game === 'ttt') {
        const gameContext = buildContext(sock, msg, []);
        if (await handleTttInput(sock, msg, gameContext, text)) return;
      }

      // UNO
      if (gameState[from]?.game === 'uno') {
        const unoContext = buildContext(sock, msg, []);
        if (await handleUnoInput(sock, msg, unoContext, text)) return;
      }

      // AUTO-JAWAB GAME
      if (gameState[from] && !SESSION_GAMES.has(gameState[from].game)) {
        const handled = await handleGameAnswer({
          sock, msg, from, sender, text,
          gameState, clearGameTimeout,
          getUser, updateUser, loadDB, formatMoney, config,
          isOwnerSender: ownerSender,
          isGroup: isGroup(from),
          botIds: [sock.user?.id, sock.user?.lid],
        });
        if (handled) return;
      }

      // RANDOM QUESTION
      if (!isCommandText(text, config.prefix)) {
        const lower = text.toLowerCase();
        const rq = [
          { keys: ['kapankah aku menikah', 'kapan aku menikah', 'kapan nikah'], ans: ['💍 *2 tahun lagi* nih!', '💍 Menikah *tahun depan*!', '💍 Sabar ya, *3-5 tahun*!'] },
          { keys: ['akankah aku', 'apakah aku akan', 'apakah aku bisa'], ans: ['🔮 *Ya, kemungkinan bisa!*', '🔮 *Tergantung usahamu.*', '🔮 *InsyaAllah bisa.*'] },
          { keys: ['apakah dia suka aku', 'dia suka aku gak'], ans: ['❤️ *Dia diam-diam suka kamu.*', '❤️ *Tanya langsung aja!*', '❤️ *Peluang 70%!*'] },
          { keys: ['ramalan', 'zodiak', 'nasib'], ans: ['🌟 *Hari ini penuh keberuntungan!*', '🌟 *Energi positif mengelilingimu.*'] },
        ];
        for (const q of rq) {
          if (q.keys.some(function(k) { return lower.includes(k); })) {
            await sock.sendMessage(from, { text: random(q.ans) });
            return;
          }
        }
        return;
      }

      // PARSE
      const args = text.slice(config.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();
      const commandPolicy = getCommandPolicy(
        command,
        plugins,
        getLimitCost,
        noLimitCommands,
        isPremiumCommand,
      );
      const { plugin, canonicalCommand, limitCost, isFree } = commandPolicy;
      const premiumConsumesLimit = Array.isArray(config.premium?.premiumConsumesLimit)
        && config.premium.premiumConsumesLimit.includes(canonicalCommand);

      // LEVEL SYSTEM
      if (config.levelSystem?.enabled && isGroup(from)) {
        const res = level.addExp(sender);
        if (res && res.success && res.leveledUp) {
          const r = res.reward || {};
          let txt = '';
          if (r.money) txt += '💰 +' + formatMoney(r.money) + '\n';
          if (r.point) txt += '⭐ +' + r.point + ' Point\n';
          if (r.limit) txt += '🎫 +' + r.limit + ' Limit\n';
          await sock.sendMessage(from, {
            text: '🎉 *LEVEL UP!*\n\nSelamat @' + senderNumber + '!\n\n📊 Level: *' + res.oldLevel + '* → *' + res.newLevel + '*\n\n🎁 Hadiah:\n' + txt,
            mentions: [sender],
          });
        }
      }

      const user = getUser(sender);
      const ownerUser = isSenderOwner(msg, sender);
      const userPremium = premiumLib.isPremium(user);

      // PREMIUM-ONLY CHECK
      if (commandPolicy.isPremiumOnly && !userPremium && !ownerUser) {
        return sock.sendMessage(from, {
          text: '╔══════════════════════════════════╗\n' +
            '║      🅟 *FITUR PREMIUM*          ║\n' +
            '╚══════════════════════════════════╝\n\n' +
            '🔒 Command *' + config.prefix + command + '* hanya untuk *user premium*.\n\n' +
            '💎 Upgrade ke premium untuk membuka:\n' +
            '• Semua fitur download (YouTube, TikTok, IG)\n' +
            '• Limit harian lebih banyak (' + (config.premium?.dailyLimit || 100) + ')\n' +
            '• Hadiah daily & EXP berlipat\n' +
            '• Diskon shop ' + (config.premium?.shopDiscount || 20) + '%\n\n' +
            '📝 Ketik *' + config.prefix + 'premium* untuk info & cara beli.\n\n' +
            '_' + config.botName + '_',
        });
      }

      // LIMIT CHECK
      if (!isFree && !ownerUser && (!userPremium || premiumConsumesLimit) && user.limit < limitCost) {
        return sock.sendMessage(from, {
          text: '⚠️ *Limit tidak cukup!*\n\n' +
            '🅛 Command *' + config.prefix + command + '* butuh *' + limitCost + ' limit*.\n' +
            '💳 Limit kamu: *' + user.limit + '*\n\n' +
            'Tunggu reset besok, beli premium, atau hubungi owner.\n\n' +
            '👑 ' + config.ownerName + '\n📞 ' + config.ownerNumber,
        });
      }

      if (!isFree && !ownerUser && (!userPremium || premiumConsumesLimit)) {
        updateUser(sender, { limit: user.limit - limitCost, totalCommands: (user.totalCommands || 0) + 1 });
      } else if (!isFree && (ownerUser || userPremium)) {
        updateUser(sender, { totalCommands: (user.totalCommands || 0) + 1 });
      }

      // CARI PLUGIN
      if (!plugin) {
        const suggestions = findClosestCommand(command);
        const suggestionLine = suggestions.length ? '\nMungkin yang kamu maksud:\n' + suggestions.map((s) => '• *' + config.prefix + s + '*').join('\n') + '\n\n' : '';
        const helpText = '❓ *Command tidak dikenal*\n\n' +
          'Coba salah satu dari opsi berikut:\n\n' +
          '• *' + config.prefix + 'menu* — menu utama\n' +
          '• *' + config.prefix + 'tutorial* — panduan cepat\n' +
          '• *' + config.prefix + 'commands* — daftar semua fitur\n' +
          '• *' + config.prefix + 'premium* — info premium\n\n' +
          suggestionLine +
          'Jika butuh bantuan, kirim *' + config.prefix + 'help* atau hubungi owner.';
        try {
          database.pushActivity({
            type: 'unknown_command',
            command: command,
            user: sender,
            senderNumber: senderNumber,
            from: from,
            text: text || command,
            success: false,
          });
        } catch (err) {
          console.error('❌ Gagal menyimpan log command tidak dikenal: ' + err.message);
        }
        await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        if (config.ownerAlerts?.enabled !== false && config.ownerAlerts?.onUnknownCommand !== false) {
          void notifyOwner(sock, config, '⚠️ Command tidak dikenal diterima\n' +
            'Command: *' + command + '*\n' +
            'Pengguna: *' + senderNumber + '*\n' +
            'Grup/Chat: *' + from + '*');
        }
        return;
      }

      // Jangan timpa sesi multi-pemain
      if (plugin.startsGame && gameState[from] && SESSION_GAMES.has(gameState[from].game) && plugin.name !== 'uno') {
        return sock.sendMessage(from, {
          text: '🎮 Masih ada permainan yang berjalan di chat ini. Selesaikan dulu permainan itu (UNO bisa dihentikan host dengan ' + config.prefix + 'unostop).',
        }, { quoted: msg });
      }

      // EXECUTE
      const ctx = buildContext(sock, msg, args);
      ctx.commandName = plugin.name;
      ctx.pluginName = plugin.name;
      const { createCommandSocket } = require('./lib/command-thumbnail');
      const commandSock = createCommandSocket(sock, ctx);
      ctx.sock = commandSock;
      const executionStartedAt = process.hrtime.bigint();
      let executionSucceeded = false;
      try {
        await executeWithProcessingReaction(sock, from, msg, plugin, () => plugin.execute(commandSock, msg, args, ctx));
        executionSucceeded = true;
        if (plugin.name !== 'commandstats' && plugin.name !== 'activitylog') {
          try {
            database.recordCommandUsage(plugin.name);
            database.pushActivity({
              type: 'command',
              command: plugin.name,
              user: sender,
              senderNumber: senderNumber,
              from: from,
              text: text || plugin.name,
              success: true,
            });
          } catch (err) {
            console.error('❌ Gagal menyimpan statistik command: ' + err.message);
          }
        }
      } catch (err) {
        console.error('❌ Error plugin "' + plugin.name + '": ' + err.stack);
        try {
          await sock.sendMessage(from, {
            text: '⚠️ *Terjadi kesalahan pada command.*\n\n' +
              'Command: *' + config.prefix + plugin.name + '*\n' +
              'Bot tetap berjalan dan error sudah dicatat. Silakan coba lagi beberapa saat lagi.',
          }, { quoted: msg });
        } catch (sendErr) {
          console.error('❌ Gagal mengirim notifikasi error plugin: ' + sendErr.message);
        }
        if (config.ownerAlerts?.enabled !== false && config.ownerAlerts?.onPluginError !== false) {
          void notifyOwner(sock, config,
            '🚨 Error plugin terdeteksi\n' +
            'Plugin: *' + plugin.name + '*\n' +
            'Pengguna: *' + senderNumber + '*\n' +
            'Chat: *' + from + '*\n' +
            'Error: ' + err.message
          );
        }
      } finally {
        const durationMs = Number(process.hrtime.bigint() - executionStartedAt) / 1e6;
        performanceStats.recordPlugin(plugin, durationMs, executionSucceeded);
      }

    } catch (err) {
      console.error('❌ Handler error: ' + err.message);
    }
  });
}

// ============ LOAD & START ============
loadPlugins().then(function() {
  return startBot();
}).catch(function(err) {
  console.error('❌ Fatal: ' + err);
  process.exit(1);
});