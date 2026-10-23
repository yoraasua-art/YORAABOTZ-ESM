// Sistem RPG ekonomi: kerja, mancing, berburu, nambang, inventory, bank, rampok.
// Semua data disimpan di users.json (field baru diisi default bila belum ada).
const MINUTE = 60 * 1000;

const ITEMS = {
  ikankecil: { name: 'Ikan Kecil', emoji: '🐟', price: 150 },
  ikanbesar: { name: 'Ikan Besar', emoji: '🐠', price: 600 },
  udang: { name: 'Udang', emoji: '🦐', price: 350 },
  kepiting: { name: 'Kepiting', emoji: '🦀', price: 800 },
  hiu: { name: 'Hiu', emoji: '🦈', price: 4000 },
  sepatubekas: { name: 'Sepatu Bekas', emoji: '👟', price: 20 },
  kelinci: { name: 'Kelinci', emoji: '🐇', price: 400 },
  ayamhutan: { name: 'Ayam Hutan', emoji: '🐓', price: 300 },
  rusa: { name: 'Rusa', emoji: '🦌', price: 1500 },
  babihutan: { name: 'Babi Hutan', emoji: '🐗', price: 1200 },
  beruang: { name: 'Beruang', emoji: '🐻', price: 5000 },
  batu: { name: 'Batu', emoji: '🪨', price: 30 },
  batubara: { name: 'Batu Bara', emoji: '⚫', price: 250 },
  besi: { name: 'Besi', emoji: '⛓️', price: 600 },
  emas: { name: 'Emas', emoji: '🪙', price: 2500 },
  berlian: { name: 'Berlian', emoji: '💎', price: 8000 },
};

// drops: [item, bobot, jumlahMin, jumlahMaks]
const ACTIVITIES = {
  mancing: {
    title: 'MEMANCING', emoji: '🎣', cooldown: 15 * MINUTE, failChance: 0.15,
    failText: 'Umpanmu dimakan ikan tapi kailnya lepas. Tidak dapat apa-apa 😅',
    drops: [['ikankecil', 40, 1, 4], ['udang', 22, 1, 3], ['ikanbesar', 18, 1, 2], ['kepiting', 10, 1, 2], ['sepatubekas', 8, 1, 1], ['hiu', 2, 1, 1]],
  },
  berburu: {
    title: 'BERBURU', emoji: '🏹', cooldown: 20 * MINUTE, failChance: 0.2,
    failText: 'Buruanmu kabur ke dalam hutan. Coba lagi nanti 🌲',
    drops: [['ayamhutan', 35, 1, 3], ['kelinci', 30, 1, 3], ['babihutan', 16, 1, 2], ['rusa', 15, 1, 1], ['beruang', 4, 1, 1]],
  },
  nambang: {
    title: 'MENAMBANG', emoji: '⛏️', cooldown: 25 * MINUTE, failChance: 0.1,
    failText: 'Terowongan runtuh sebagian, kamu pulang dengan tangan kosong ⚠️',
    drops: [['batu', 35, 2, 6], ['batubara', 28, 1, 4], ['besi', 20, 1, 3], ['emas', 13, 1, 2], ['berlian', 4, 1, 1]],
  },
};

const JOBS = [
  ['ojek online', 'mengantar penumpang'], ['barista', 'meracik kopi'], ['programmer', 'memperbaiki bug'],
  ['kurir', 'mengantar paket'], ['petani', 'memanen padi'], ['guru les', 'mengajar murid'],
  ['montir', 'memperbaiki motor'], ['desainer', 'membuat logo'], ['koki', 'memasak di restoran'], ['satpam', 'menjaga kompleks'],
];

const DEFAULTS = {
  kerjaCooldown: 30 * MINUTE,
  kerjaMin: 400,
  kerjaMax: 1500,
  rampokCooldown: 60 * MINUTE,
  rampokChance: 0.4,
  rampokMinTarget: 1000,
  rampokMaxSteal: 20000,
  bankInterest: 0.02,
  bankMaxInterestPerDay: 5000,
  bankMax: 10_000_000,
};

function settings(config) {
  return { ...DEFAULTS, ...(config?.rpg || {}) };
}

function ensureRpg(user) {
  return {
    inventory: { ...(user?.inventory || {}) },
    bank: Number(user?.bank) || 0,
    bankUpdatedAt: Number(user?.bankUpdatedAt) || 0,
    cooldowns: { ...(user?.cooldowns || {}) },
  };
}

function cooldownLeft(user, key, duration, now = Date.now()) {
  const last = Number(user?.cooldowns?.[key]) || 0;
  return Math.max(0, last + duration - now);
}

function formatWait(ms) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
  return minutes ? `${minutes} menit ${seconds} detik` : `${seconds} detik`;
}

function randomInt(min, max, rand = Math.random) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function rollDrop(activity, rand = Math.random) {
  if (rand() < activity.failChance) return null;
  const total = activity.drops.reduce((sum, drop) => sum + drop[1], 0);
  let roll = rand() * total;
  for (const [item, weight, min, max] of activity.drops) {
    roll -= weight;
    if (roll < 0) return { item, amount: randomInt(min, max, rand) };
  }
  const last = activity.drops[activity.drops.length - 1];
  return { item: last[0], amount: last[2] };
}

function findItem(query) {
  const wanted = String(query || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!wanted) return null;
  if (ITEMS[wanted]) return wanted;
  return Object.keys(ITEMS).find(key => ITEMS[key].name.toLowerCase().replace(/[^a-z]/g, '') === wanted)
    || Object.keys(ITEMS).find(key => key.startsWith(wanted)) || null;
}

function inventoryValue(inventory) {
  return Object.entries(inventory || {}).reduce((sum, [key, amount]) => sum + (ITEMS[key]?.price || 0) * amount, 0);
}

// "all"/"semua" → max, "10k" → 10000, "1jt" → 1000000
function parseAmount(value, max) {
  const text = String(value || '').toLowerCase().replace(/[.,]/g, '');
  if (['all', 'semua', 'max'].includes(text)) return max;
  const match = text.match(/^(\d+)(k|rb|jt)?$/);
  if (!match) return NaN;
  const multiplier = { k: 1000, rb: 1000, jt: 1_000_000 }[match[2]] || 1;
  return Number(match[1]) * multiplier;
}

// Bunga harian sederhana, dihitung saat user membuka bank.
function applyInterest(user, config, now = Date.now()) {
  const opts = settings(config);
  const rpg = ensureRpg(user);
  if (!rpg.bankUpdatedAt || rpg.bank <= 0) return { bank: rpg.bank, interest: 0, bankUpdatedAt: rpg.bankUpdatedAt || now };
  const days = Math.floor((now - rpg.bankUpdatedAt) / (24 * 60 * MINUTE));
  if (days < 1) return { bank: rpg.bank, interest: 0, bankUpdatedAt: rpg.bankUpdatedAt };
  const perDay = Math.min(Math.floor(rpg.bank * opts.bankInterest), opts.bankMaxInterestPerDay);
  const interest = Math.max(0, Math.min(perDay * Math.min(days, 30), opts.bankMax - rpg.bank));
  return { bank: rpg.bank + interest, interest, bankUpdatedAt: rpg.bankUpdatedAt + days * 24 * 60 * MINUTE };
}

module.exports = {
  MINUTE, ITEMS, ACTIVITIES, JOBS, DEFAULTS, settings, ensureRpg, cooldownLeft, formatWait,
  randomInt, rollDrop, findItem, inventoryValue, parseAmount, applyInterest,
};
