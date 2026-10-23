const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const config = require('../config');
const { evaluate } = require('../lib/calculator');
const rpg = require('../lib/rpg');
const gameStats = require('../lib/game-stats');
const pvp = require('../lib/pvp');
const guard = require('../lib/group-guard');
const { handleGameAnswer } = require('../lib/game-engine');
const maker = require('../lib/sticker-maker');

const GROUP = '120363000000000000@g.us';
const A = '6281100000001@s.whatsapp.net';
const B = '6281100000002@s.whatsapp.net';

function world(extra = {}) {
  const db = {};
  const groups = {};
  const sent = [];
  const sock = {
    user: { id: '6289999999999:1@s.whatsapp.net' },
    sendMessage: async (jid, content) => { sent.push({ jid, ...content }); return { key: { id: String(sent.length) } }; },
    groupMetadata: async () => ({
      subject: 'Grup Tes',
      participants: [
        { id: '6289999999999@s.whatsapp.net', admin: 'admin' },
        { id: A, admin: 'admin' },
        { id: B, admin: null },
      ],
    }),
    groupParticipantsUpdate: async (jid, users, action) => { sent.push({ jid, kick: users, action }); },
    ...extra,
  };
  const getUser = jid => db[jid] || (db[jid] = { money: 10000, point: 0, exp: 0, registered: true });
  const updateUser = (jid, updates) => Object.assign(getUser(jid), updates);
  const getGroupSettings = jid => groups[jid] || (groups[jid] = {});
  const updateGroupSettings = (jid, updates) => Object.assign(getGroupSettings(jid), updates);
  const ctxFor = (sender, from = GROUP, mentioned = []) => ({
    config, from, sender, mentioned, getUser, updateUser, getGroupSettings, updateGroupSettings,
    loadDB: () => db, isGroup: jid => String(jid).endsWith('@g.us'), isSenderOwner: () => false,
    formatMoney: n => `Rp ${Number(n).toLocaleString('id-ID')}`, user: getUser(sender),
  });
  return { db, groups, sent, sock, getUser, updateUser, getGroupSettings, updateGroupSettings, ctxFor };
}

const msgFrom = (sender, text = '', from = GROUP) => ({ key: { remoteJid: from, participant: sender, id: `m${Math.random()}` }, message: { conversation: text } });

test('kalkulator aman: operator, fungsi, persen, faktorial, dan menolak kode', () => {
  assert.equal(evaluate('(12+8)*3^2'), 180);
  assert.equal(evaluate('50%*200'), 100);
  assert.equal(evaluate('10 % 3'), 1);
  assert.equal(evaluate('sqrt(16)+5!'), 124);
  assert.equal(evaluate('2x3'), 6);
  assert.equal(evaluate('sin(30)'), 0.5);
  assert.throws(() => evaluate('1/0'), /nol/);
  assert.throws(() => evaluate('process.exit()'), /tidak dikenal|Karakter/);
});

test('rpg: parse jumlah, bunga bank harian, drop barang', () => {
  assert.equal(rpg.parseAmount('10k', 0), 10000);
  assert.equal(rpg.parseAmount('all', 77), 77);
  assert.ok(Number.isNaN(rpg.parseAmount('abc', 5)));
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  assert.deepEqual(rpg.applyInterest({ bank: 100000, bankUpdatedAt: now - 3 * day }, config, now), { bank: 106000, interest: 6000, bankUpdatedAt: now });
  assert.equal(rpg.applyInterest({ bank: 100000, bankUpdatedAt: now - 1000 }, config, now).interest, 0);
  assert.equal(rpg.rollDrop(rpg.ACTIVITIES.mancing, () => 0), null);
  assert.deepEqual(rpg.rollDrop(rpg.ACTIVITIES.mancing, () => 0.5), { item: 'udang', amount: 2 });
});

test('.mancing memberi barang lalu cooldown; .jual menukar ke uang; .tabung/.tarik', async () => {
  const w = world();
  const mancing = require('../plugins/ekonomi/mancing');
  const jual = require('../plugins/ekonomi/jual');
  const bank = require('../plugins/ekonomi/bank');
  const original = Math.random;
  Math.random = () => 0.5;
  try {
    await mancing.execute(w.sock, msgFrom(A), [], w.ctxFor(A));
  } finally {
    Math.random = original;
  }
  assert.equal(w.getUser(A).inventory.udang, 2);
  await mancing.execute(w.sock, msgFrom(A), [], w.ctxFor(A));
  assert.match(w.sent.at(-1).text, /lelah/);

  await jual.execute(w.sock, msgFrom(A), ['udang', 'all'], w.ctxFor(A));
  assert.equal(w.getUser(A).money, 10000 + 2 * rpg.ITEMS.udang.price);
  assert.equal(w.getUser(A).inventory.udang, undefined);

  await bank.deposit(w.sock, msgFrom(A), ['5k'], w.ctxFor(A));
  assert.equal(w.getUser(A).bank, 5000);
  await bank.withdraw(w.sock, msgFrom(A), ['all'], w.ctxFor(A));
  assert.equal(w.getUser(A).bank, 0);
  assert.equal(w.getUser(A).money, 10000 + 2 * rpg.ITEMS.udang.price);
});

test('statistik game: menang, streak harian, dan hadiah leaderboard mingguan', () => {
  const w = world();
  const weeklyPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'weekly-')), 'weekly.json');
  const deps = { getUser: w.getUser, updateUser: w.updateUser, loadDB: () => w.db, config, weeklyPath };
  gameStats.recordWin(deps, A, 'susunkata', new Date('2026-10-03T05:00:00Z'));
  gameStats.recordWin(deps, A, 'susunkata', new Date('2026-10-04T05:00:00Z'));
  gameStats.recordWin(deps, B, 'tekateki', new Date('2026-10-04T06:00:00Z'));
  const stats = w.getUser(A).gameStats;
  assert.equal(stats.wins, 2);
  assert.equal(stats.streakDays, 2);
  assert.deepEqual(gameStats.favoriteGame(stats), ['susunkata', 2]);

  const before = w.getUser(A).money;
  const state = gameStats.rolloverWeek(deps, new Date('2026-10-06T05:00:00Z'));
  assert.equal(state.lastWinners[0].jid, A);
  assert.equal(w.getUser(A).money, before + config.weeklyGame.prizes[0]);
  assert.equal(gameStats.rolloverWeek(deps, new Date('2026-10-07T05:00:00Z')).lastWinners.length, 2, 'hadiah tidak dibagikan dua kali');
});

test('game baru (susunkata) memakai mesin jawaban: salah dibalas, benar diberi hadiah & statistik', async () => {
  const w = world();
  const gameState = {};
  const plugin = require('../plugins/game/susunkata');
  await plugin.execute(w.sock, msgFrom(A), [], { ...w.ctxFor(A), gameState, setGameTimeout: () => {} });
  assert.equal(gameState[GROUP].game, 'susunkata');
  const answer = gameState[GROUP].jawab;
  const deps = text => ({
    sock: w.sock, msg: msgFrom(B, text), from: GROUP, sender: B, text, gameState, clearGameTimeout: () => {},
    getUser: w.getUser, updateUser: w.updateUser, formatMoney: n => `Rp ${n}`, config, isGroup: true, botIds: [],
  });
  assert.equal(await handleGameAnswer(deps('salahbanget')), true);
  assert.match(w.sent.at(-1).text, /salah/i);
  assert.equal(await handleGameAnswer(deps(answer)), true);
  assert.equal(gameState[GROUP], undefined);
  assert.equal(w.getUser(B).gameStats.byGame.susunkata, 1);
});

test('tebakangka sulit: 1-100 dengan petunjuk lebih besar/kecil', async () => {
  const w = world();
  const gameState = {};
  await require('../plugins/game/tebakangka').execute(w.sock, msgFrom(A), ['sulit'], { ...w.ctxFor(A), gameState, setGameTimeout: () => {} });
  gameState[GROUP].angka = 60;
  assert.equal(gameState[GROUP].max, 100);
  await handleGameAnswer({
    sock: w.sock, msg: msgFrom(B, '30'), from: GROUP, sender: B, text: '30', gameState, clearGameTimeout: () => {},
    getUser: w.getUser, updateUser: w.updateUser, formatMoney: n => `Rp ${n}`, config, isGroup: true, botIds: [],
  });
  assert.match(w.sent.at(-1).text, /kecil|besar/i);
});

test('suit PvP: tantangan, terima, pilihan rahasia di chat pribadi, taruhan berpindah', async () => {
  const w = world();
  const original = await pvp.createChallenge('suit', w.sock, msgFrom(A), ['@b', '1000'], w.ctxFor(A, GROUP, [B]));
  assert.ok(original);
  assert.ok(pvp.challenges.has(GROUP));
  assert.equal(await pvp.handlePvpText(w.sock, msgFrom(B, 'terima'), w.ctxFor(B), 'terima'), true);
  const dmA = { key: { remoteJid: A, id: 'x1' }, message: { conversation: 'batu' } };
  const dmB = { key: { remoteJid: B, id: 'x2' }, message: { conversation: 'gunting' } };
  assert.equal(await pvp.handlePvpText(w.sock, dmA, w.ctxFor(A, A), 'batu'), true);
  assert.equal(await pvp.handlePvpText(w.sock, dmB, w.ctxFor(B, B), 'gunting'), true);
  assert.equal(pvp.challenges.has(GROUP), false);
  assert.equal(w.getUser(A).money, 11000);
  assert.equal(w.getUser(B).money, 9000);
  assert.match(w.sent.at(-1).text, /menang/);
});

test('duel: simulasi selalu menghasilkan pemenang', () => {
  for (let i = 0; i < 20; i++) {
    const result = pvp.simulateDuel(['A', 'B']);
    assert.ok([0, 1].includes(result.winner));
    assert.equal(result.hp[1 - result.winner], 0);
  }
});

test('anti-toxic mendeteksi kata kasar (termasuk variasi huruf) tanpa salah tangkap', () => {
  assert.equal(guard.findToxicWord('dasar anjiiing lu'), 'anjing');
  assert.equal(guard.findToxicWord('g0bl0k banget'), 'goblok');
  assert.equal(guard.findToxicWord('selamat pagi semuanya'), null);
  assert.equal(guard.findToxicWord('aku suka kucing'), null);
  assert.equal(guard.findToxicWord('dasar curut', ['curut']), 'curut');
});

test('.warn: tiga peringatan membuat anggota dikeluarkan otomatis', async () => {
  const w = world();
  const warn = require('../plugins/group/warn');
  const msg = { ...msgFrom(A), message: { extendedTextMessage: { text: '.warn @b spam', contextInfo: { mentionedJid: [B] } } } };
  for (let i = 0; i < 3; i++) await warn.execute(w.sock, msg, ['@b', 'spam'], w.ctxFor(A, GROUP, [B]));
  assert.ok(w.sent.some(entry => entry.action === 'remove' && entry.kick.includes(B)));
  assert.equal(guard.getWarns(w.getGroupSettings, GROUP, B), 0);
});

test('.sider mencantumkan anggota yang belum aktif', () => {
  const { findInactive } = require('../plugins/group/sider');
  const now = Date.now();
  const participants = [{ id: A, admin: null }, { id: B, admin: null }, { id: '628300@s.whatsapp.net', admin: 'admin' }];
  const activity = { since: now - 30 * 864e5, members: { '6281100000001': now - 1000 } };
  const result = findInactive(participants, activity, 7, now);
  assert.deepEqual(result.map(entry => entry.participant.id), [B]);
});

test('islami: parser ayat & pencarian doa lokal', () => {
  const { parseReference } = require('../plugins/islami/ayat');
  assert.deepEqual(parseReference(['2:255']), { surah: '2', ayat: 255 });
  assert.deepEqual(parseReference(['al-baqarah', '255']), { surah: 'al-baqarah', ayat: 255 });
  assert.equal(parseReference(['yasin']), null);
  const { findDoa } = require('../plugins/islami/doa');
  assert.ok(findDoa('makan'));
  assert.ok(findDoa('1'));
  assert.equal(require('../lib/islami-data').ASMAUL_HUSNA.length, 99);
});

test('sticker teks: ttp/brat menghasilkan PNG 512x512', async () => {
  const sharp = require('sharp');
  for (const image of [await maker.ttpImage('Halo <dunia> & semua'), await maker.bratImage('teks brat')]) {
    const meta = await sharp(image).metadata();
    assert.equal(meta.format, 'png');
    assert.equal(meta.width, 512);
  }
  await assert.rejects(() => maker.ttpImage('   '), /kosong/);
});

test('owner command baru menolak non-owner', async () => {
  const w = world();
  for (const name of ['join', 'leave', 'setppbot', 'setbio', 'listgc', 'blocklist']) {
    const plugin = require(`../plugins/owner/${name}`);
    await plugin.execute(w.sock, msgFrom(B), ['x'], w.ctxFor(B));
    assert.match(w.sent.at(-1).text, /owner/i, name);
  }
});
