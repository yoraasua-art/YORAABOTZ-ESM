// Tantangan PvP antar user di grup: suit (pilihan rahasia lewat chat pribadi) dan duel.
const { digits } = require('./group-utils');

const CHALLENGE_TTL = 2 * 60 * 1000;
const CHOICES = { batu: '✊', gunting: '✌️', kertas: '✋' };
const challenges = new Map();     // groupId -> challenge
const pendingChoices = new Map(); // digits pemain -> groupId

function idsOf(...jids) {
  return [...new Set(jids.filter(Boolean).map(digits).filter(Boolean))];
}

function senderIds(msg, sender) {
  return idsOf(sender, msg?.key?.participant, msg?.key?.participantAlt, msg?.key?.remoteJid, msg?.key?.remoteJidAlt);
}

function tag(jid) {
  return `@${digits(jid)}`;
}

function clearChallenge(groupId) {
  const challenge = challenges.get(groupId);
  if (!challenge) return;
  clearTimeout(challenge.timer);
  for (const id of [...challenge.p1.ids, ...challenge.p2.ids]) {
    if (pendingChoices.get(id) === groupId) pendingChoices.delete(id);
  }
  challenges.delete(groupId);
}

function suitWinner(a, b) {
  if (a === b) return 0;
  return (a === 'batu' && b === 'gunting') || (a === 'gunting' && b === 'kertas') || (a === 'kertas' && b === 'batu') ? 1 : 2;
}

function simulateDuel(names, rand = Math.random) {
  const hp = [100, 100];
  const log = [];
  let attacker = rand() < 0.5 ? 0 : 1;
  for (let round = 1; round <= 30 && hp[0] > 0 && hp[1] > 0; round++) {
    const defender = 1 - attacker;
    const roll = rand();
    if (roll < 0.15) {
      log.push(`💨 ${names[defender]} menghindari serangan ${names[attacker]}!`);
    } else {
      const crit = roll > 0.85;
      const damage = Math.floor((8 + rand() * 17) * (crit ? 2 : 1));
      hp[defender] = Math.max(0, hp[defender] - damage);
      log.push(`${crit ? '💥 KRITIKAL! ' : '⚔️ '}${names[attacker]} menyerang ${names[defender]} -${damage} HP (sisa ${hp[defender]})`);
    }
    attacker = defender;
  }
  return { winner: hp[0] > 0 ? 0 : 1, hp, log };
}

function validateBet(bet, config) {
  if (!bet) return null;
  if (!Number.isInteger(bet) || bet < config.minBet || bet > config.maxBet) {
    return `❌ Taruhan harus ${config.minBet}–${config.maxBet}, atau kosongkan untuk main tanpa taruhan.`;
  }
  return null;
}

function hasMoney(ctx, jid, bet) {
  return !bet || (Number(ctx.getUser(jid).money) || 0) >= bet;
}

function transfer(ctx, winner, loser, bet) {
  if (!bet) return;
  const loserUser = ctx.getUser(loser);
  const paid = Math.min(bet, Number(loserUser.money) || 0);
  ctx.updateUser(loser, { money: (Number(loserUser.money) || 0) - paid });
  const winnerUser = ctx.getUser(winner);
  ctx.updateUser(winner, { money: (Number(winnerUser.money) || 0) + paid });
}

function recordPvpWin(ctx, jid, type) {
  try {
    require('./game-stats').recordWin(ctx, jid, type);
  } catch (error) {
    console.error('Statistik PvP gagal disimpan:', error.message);
  }
}

/** Buat tantangan baru. ctx: { sock, msg, from, sender, mentioned, config, getUser, formatMoney } */
async function createChallenge(type, sock, msg, args, ctx) {
  const { from, sender, config } = ctx;
  const reply = text => sock.sendMessage(from, { text, mentions: [sender, ...(ctx.mentioned || [])] }, { quoted: msg });
  if (!ctx.isGroup(from)) return reply(`❌ ${type === 'suit' ? 'Suit PvP' : 'Duel'} hanya bisa dimainkan di grup.`);
  const target = ctx.mentioned?.[0];
  if (!target) return reply(`Format: *${config.prefix}${type} @user [taruhan]*`);
  if (senderIds(msg, sender).includes(digits(target))) return reply('❌ Tidak bisa menantang diri sendiri.');
  if (challenges.has(from)) return reply('⏳ Masih ada tantangan PvP yang berjalan di grup ini. Tunggu selesai dulu.');
  const bet = parseInt(args.find(arg => /^\d+$/.test(arg)), 10) || 0;
  const betError = validateBet(bet, config);
  if (betError) return reply(betError);
  if (!hasMoney(ctx, sender, bet)) return reply('❌ Uangmu tidak cukup untuk taruhan itu.');

  const challenge = {
    type, groupId: from, bet, accepted: false,
    p1: { jid: sender, ids: senderIds(msg, sender), choice: null },
    p2: { jid: target, ids: idsOf(target), choice: null },
  };
  challenge.timer = setTimeout(async () => {
    if (challenges.get(from) !== challenge) return;
    clearChallenge(from);
    try {
      await sock.sendMessage(from, { text: `⌛ Tantangan ${type} antara ${tag(challenge.p1.jid)} dan ${tag(challenge.p2.jid)} kedaluwarsa.`, mentions: [challenge.p1.jid, challenge.p2.jid] });
    } catch { /* abaikan */ }
  }, CHALLENGE_TTL);
  if (challenge.timer.unref) challenge.timer.unref();
  challenges.set(from, challenge);

  const formatMoney = ctx.formatMoney || (n => `Rp ${n}`);
  return sock.sendMessage(from, {
    text: `${type === 'suit' ? '✊ *SUIT PvP*' : '⚔️ *DUEL*'}\n\n${tag(sender)} menantang ${tag(target)}!${bet ? `\n💰 Taruhan: ${formatMoney(bet)}` : ''}\n\n` +
      `${tag(target)}, ketik *terima* atau *tolak* (2 menit).`,
    mentions: [sender, target],
  }, { quoted: msg });
}

async function finishSuit(sock, ctx, challenge) {
  const { p1, p2, bet, groupId } = challenge;
  clearChallenge(groupId);
  const result = suitWinner(p1.choice, p2.choice);
  const formatMoney = ctx.formatMoney || (n => `Rp ${n}`);
  let text = `✊ *HASIL SUIT PvP*\n\n${tag(p1.jid)}: ${CHOICES[p1.choice]} ${p1.choice}\n${tag(p2.jid)}: ${CHOICES[p2.choice]} ${p2.choice}\n\n`;
  if (result === 0) {
    text += '🤝 *Seri!* Tidak ada uang yang berpindah.';
  } else {
    const [winner, loser] = result === 1 ? [p1, p2] : [p2, p1];
    transfer(ctx, winner.jid, loser.jid, bet);
    recordPvpWin(ctx, winner.jid, 'suitpvp');
    text += `🎉 ${tag(winner.jid)} menang!${bet ? ` +${formatMoney(bet)}` : ''}`;
  }
  await sock.sendMessage(groupId, { text, mentions: [p1.jid, p2.jid] });
}

async function startDuel(sock, ctx, challenge) {
  const { p1, p2, bet, groupId } = challenge;
  clearChallenge(groupId);
  const names = [tag(p1.jid), tag(p2.jid)];
  const duel = simulateDuel(names);
  const [winner, loser] = duel.winner === 0 ? [p1, p2] : [p2, p1];
  transfer(ctx, winner.jid, loser.jid, bet);
  recordPvpWin(ctx, winner.jid, 'duel');
  const formatMoney = ctx.formatMoney || (n => `Rp ${n}`);
  const log = duel.log.length > 12 ? [...duel.log.slice(0, 5), '...', ...duel.log.slice(-6)] : duel.log;
  await sock.sendMessage(groupId, {
    text: `⚔️ *DUEL DIMULAI!*\n\n${log.join('\n')}\n\n🏆 ${tag(winner.jid)} memenangkan duel!${bet ? ` +${formatMoney(bet)}` : ''}`,
    mentions: [p1.jid, p2.jid],
  });
}

async function respond(sock, msg, ctx, accept) {
  const { from, sender } = ctx;
  const challenge = challenges.get(from);
  const ids = senderIds(msg, sender);
  if (!challenge || challenge.accepted) return false;
  const isTarget = challenge.p2.ids.some(id => ids.includes(id));
  const isChallenger = challenge.p1.ids.some(id => ids.includes(id));
  if (!isTarget && !(isChallenger && !accept)) return false;
  if (!accept) {
    clearChallenge(from);
    await sock.sendMessage(from, { text: `❌ Tantangan ${challenge.type} ${isTarget ? 'ditolak' : 'dibatalkan'}.`, mentions: [challenge.p1.jid, challenge.p2.jid] }, { quoted: msg });
    return true;
  }
  challenge.p2.jid = sender;
  challenge.p2.ids = idsOf(...challenge.p2.ids, ...ids);
  if (!hasMoney(ctx, challenge.p1.jid, challenge.bet) || !hasMoney(ctx, challenge.p2.jid, challenge.bet)) {
    clearChallenge(from);
    await sock.sendMessage(from, { text: '❌ Salah satu pemain tidak punya cukup uang untuk taruhan. Tantangan dibatalkan.' }, { quoted: msg });
    return true;
  }
  challenge.accepted = true;
  if (challenge.type === 'duel') {
    await startDuel(sock, ctx, challenge);
    return true;
  }
  for (const player of [challenge.p1, challenge.p2]) {
    for (const id of player.ids) pendingChoices.set(id, from);
  }
  await sock.sendMessage(from, {
    text: `✅ Tantangan diterima! ${tag(challenge.p1.jid)} dan ${tag(challenge.p2.jid)}, kirim pilihan lewat chat pribadi bot: *batu*, *gunting*, atau *kertas*.`,
    mentions: [challenge.p1.jid, challenge.p2.jid],
  }, { quoted: msg });
  for (const player of [challenge.p1, challenge.p2]) {
    try {
      await sock.sendMessage(player.jid, { text: '✊ *SUIT PvP*\n\nBalas pesan ini dengan pilihanmu: *batu*, *gunting*, atau *kertas*.\nPilihanmu dirahasiakan sampai lawan memilih.' });
    } catch (error) {
      console.error('Gagal kirim DM suit:', error.message);
    }
  }
  return true;
}

/** Tangani teks tanpa prefix (terima/tolak di grup, pilihan suit di chat pribadi). */
async function handlePvpText(sock, msg, ctx, text) {
  const lower = String(text || '').trim().toLowerCase();
  if (ctx.isGroup(ctx.from)) {
    if (!challenges.has(ctx.from)) return false;
    if (['terima', 'accept', 'gas', 'ayo'].includes(lower)) return respond(sock, msg, ctx, true);
    if (['tolak', 'reject', 'batal', 'cancel'].includes(lower)) return respond(sock, msg, ctx, false);
    return false;
  }
  if (!CHOICES[lower]) return false;
  const ids = senderIds(msg, ctx.sender);
  const groupId = ids.map(id => pendingChoices.get(id)).find(Boolean);
  const challenge = groupId && challenges.get(groupId);
  if (!challenge || challenge.type !== 'suit' || !challenge.accepted) return false;
  const player = [challenge.p1, challenge.p2].find(entry => entry.ids.some(id => ids.includes(id)));
  if (!player) return false;
  if (player.choice) {
    await sock.sendMessage(ctx.from, { text: `Kamu sudah memilih *${player.choice}*. Tunggu lawanmu.` }, { quoted: msg });
    return true;
  }
  player.choice = lower;
  await sock.sendMessage(ctx.from, { text: `✅ Pilihan *${lower}* tersimpan. Hasil akan diumumkan di grup.` }, { quoted: msg });
  if (challenge.p1.choice && challenge.p2.choice) await finishSuit(sock, ctx, challenge);
  return true;
}

module.exports = {
  CHOICES, CHALLENGE_TTL, challenges, pendingChoices,
  createChallenge, respond, handlePvpText, suitWinner, simulateDuel, clearChallenge,
};
