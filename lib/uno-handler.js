// ============================================================
//   UNO — sisi WhatsApp (pesan grup, DM kartu, timer, hadiah)
//   Logika kartu ada di lib/uno-game.js
// ============================================================

const uno = require('./uno-game');
const { formatDuration } = require('./game-engine');

const REWARD_BASE = 3000;
const REWARD_PER_EXTRA_PLAYER = 500;
const REWARD_POINT = 10;

const tag = jid => `@${String(jid).split('@')[0]}`;
const turnMs = config => Number(config?.gameTimeout) || 120000;

function getGame(ctx) {
  const game = ctx.gameState[ctx.from];
  return game && game.game === 'uno' ? game : null;
}

function findGameByPlayer(gameState, jid) {
  for (const [room, game] of Object.entries(gameState)) {
    if (game && game.game === 'uno' && game.players.includes(jid)) return { room, game };
  }
  return null;
}

async function send(sock, room, text, mentions = [], quoted) {
  return sock.sendMessage(room, { text, mentions: [...new Set(mentions)] }, quoted ? { quoted } : undefined);
}

// ---------- Timer ----------

function clearUnoTimer(game) {
  if (game.timer) clearTimeout(game.timer);
  game.timer = null;
}

function armTimer(deps, room, game) {
  clearUnoTimer(game);
  game.timer = setTimeout(() => {
    onTimeout(deps, room, game).catch(error => console.error(`❌ UNO timeout: ${error.message}`));
  }, turnMs(deps.config));
  game.timer.unref?.();
}

async function onTimeout(deps, room, game) {
  const { sock, gameState } = deps;
  if (gameState[room] !== game) return;

  if (game.phase === 'lobby') {
    delete gameState[room];
    await send(sock, room, '⌛ Lobi UNO ditutup karena tidak ada yang memulai permainan.');
    return;
  }

  const result = uno.handleTurnTimeout(game);
  const lines = [`⏰ ${tag(result.jid)} kehabisan waktu (${formatDuration(turnMs(deps.config))}).`];
  if (result.kicked) lines.push(`🚪 ${tag(result.jid)} dikeluarkan karena ${uno.MAX_IDLE_TURNS}x tidak bergerak.`);
  else lines.push('Kamu otomatis ambil 1 kartu dan giliran dilewati.');
  const mentions = [result.jid];

  if (game.players.length < uno.MIN_PLAYERS) {
    clearUnoTimer(game);
    delete gameState[room];
    lines.push('\n🛑 Pemain tersisa kurang dari 2, permainan UNO dibatalkan.');
    await send(sock, room, lines.join('\n'), mentions);
    return;
  }
  await announceTurn(deps, room, game, lines.join('\n'), mentions);
  if (!result.kicked) await sendHand(deps, room, game, result.jid, '🃏 Kartu barumu (hasil timeout):');
  await sendHand(deps, room, game, uno.currentPlayer(game), '🃏 Giliranmu! Kartumu:');
}

// ---------- DM kartu ----------

async function sendHand(deps, room, game, jid, intro) {
  const isTurn = game.phase === 'playing' && uno.currentPlayer(game) === jid;
  const lines = [
    intro || '🃏 *KARTU UNO KAMU*',
    '',
    uno.renderHand(game, jid),
    '',
    `Kartu teratas: ${uno.describeTop(game)}`,
  ];
  if (isTurn) {
    lines.push('', '✅ *Giliranmu!* Kode *tebal* = bisa dimainkan.',
      `Ketik di grup, contoh: *${uno.playableCards(game, jid).map(uno.cardCode)[0] || 'draw'}*`,
      'Atau ketik *draw* untuk ambil kartu.');
  }
  try {
    await deps.sock.sendMessage(jid, { text: lines.join('\n') });
    return true;
  } catch (error) {
    if (!game.dmWarned) game.dmWarned = new Set();
    if (!game.dmWarned.has(jid)) {
      game.dmWarned.add(jid);
      await send(deps.sock, room,
        `⚠️ ${tag(jid)} bot tidak bisa mengirim kartu lewat chat pribadi. Kirim pesan apa saja ke bot dulu (chat pribadi), lalu ketik *kartu* di grup.`,
        [jid]);
    }
    return false;
  }
}

async function sendHandsToAll(deps, room, game) {
  for (const jid of game.players) {
    await sendHand(deps, room, game, jid, '🃏 *KARTU UNO KAMU* — permainan dimulai!');
  }
}

// ---------- Pesan grup ----------

async function announceTurn(deps, room, game, header, mentions = []) {
  const current = uno.currentPlayer(game);
  const text = [
    header,
    '',
    `Kartu teratas: ${uno.describeTop(game)}`,
    `➡️ Giliran: ${tag(current)} (${formatDuration(turnMs(deps.config))})`,
    uno.renderScoreboard(game),
    '',
    '_Ketik kode kartu, *draw*, atau *pass*. *kartu* untuk kirim ulang kartumu._',
  ].join('\n');
  await send(deps.sock, room, text, [...mentions, current, ...game.players]);
  armTimer(deps, room, game);
}

function describeEvents(game, events) {
  const lines = [];
  const mentions = [];
  for (const event of events) {
    if (event.type === 'skip') {
      lines.push(`⛔ ${tag(event.player)} dilewati!`);
      mentions.push(event.player);
    } else if (event.type === 'reverse') {
      lines.push('🔄 Arah permainan berbalik!');
    } else if (event.type === 'draw') {
      lines.push(`➕ ${tag(event.player)} ambil ${event.count} kartu dan dilewati!`);
      mentions.push(event.player);
    }
  }
  return { lines, mentions };
}

async function finishGame(deps, room, game, winner) {
  const { sock, gameState, getUser, updateUser, formatMoney } = deps;
  clearUnoTimer(game);
  delete gameState[room];

  const extra = Math.max(0, game.players.length - uno.MIN_PLAYERS);
  const money = REWARD_BASE + extra * REWARD_PER_EXTRA_PLAYER;
  const user = getUser(winner);
  updateUser(winner, { money: user.money + money, point: user.point + REWARD_POINT });

  const leftovers = game.players
    .filter(jid => jid !== winner)
    .map(jid => `${tag(jid)} ${game.hands[jid].length} kartu`)
    .join('\n');
  await send(sock, room,
    `🏆 *UNO SELESAI!*\n\n🎉 Pemenang: ${tag(winner)}\n+${REWARD_POINT} Point\n+${formatMoney(money)}\n\nSisa kartu:\n${leftovers || '-'}`,
    game.players);
}

// ---------- Input permainan (tanpa prefix) ----------

async function handleUnoInput(sock, msg, ctx, text) {
  const game = getGame(ctx);
  if (!game || game.phase !== 'playing' || !game.players.includes(ctx.sender)) return false;
  const raw = String(text ?? '').trim();
  if (!raw || raw.startsWith(ctx.config.prefix)) return false;

  const deps = { ...ctx, sock };
  const { from, sender } = ctx;
  const lower = raw.toLowerCase();
  const current = uno.currentPlayer(game);

  if (lower === 'kartu' || lower === 'hand' || lower === 'cekkartu') {
    await sendHand(deps, from, game, sender);
    return true;
  }

  if (lower === 'uno') {
    const result = uno.callUno(game, sender);
    return handleUnoCall(deps, from, game, sender, result, msg);
  }

  if (['draw', 'ambil', 'tarik'].includes(lower)) {
    const result = uno.drawCard(game, sender);
    if (!result.ok) return replyError(sock, from, game, result.error, msg);
    if (result.playable) {
      armTimer(deps, from, game);
      await send(sock, from, `🃏 ${tag(sender)} ambil 1 kartu.\nKartunya bisa dimainkan! Mainkan kartu itu atau ketik *pass*.`, [sender], msg);
      await sendHand(deps, from, game, sender, `🃏 Kamu mengambil ${result.card ? uno.cardLabel(result.card) : 'kartu'} (*${result.card ? uno.cardCode(result.card) : ''}*). Mainkan atau ketik *pass*:`);
      return true;
    }
    await announceTurn(deps, from, game, `🃏 ${tag(sender)} ambil 1 kartu dan tidak bisa memainkannya.`, [sender]);
    if (result.card) await sendHand(deps, from, game, sender, '🃏 Kartu barumu:');
    await sendHand(deps, from, game, uno.currentPlayer(game), '🃏 Giliranmu! Kartumu:');
    return true;
  }

  if (['pass', 'lewat', 'lanjut'].includes(lower)) {
    const result = uno.passTurn(game, sender);
    if (!result.ok) return replyError(sock, from, game, result.error, msg);
    await announceTurn(deps, from, game, `⏭️ ${tag(sender)} melewati giliran.`, [sender]);
    await sendHand(deps, from, game, uno.currentPlayer(game), '🃏 Giliranmu! Kartumu:');
    return true;
  }

  const parsed = uno.parseCardInput(raw);
  if (!parsed) return false;
  if (sender !== current) return replyError(sock, from, game, 'not-turn', msg);

  const result = uno.playCard(game, sender, parsed);
  if (!result.ok) return replyError(sock, from, game, result.error, msg);

  if (result.winner) {
    await finishGame(deps, from, game, result.winner);
    return true;
  }

  const { lines, mentions } = describeEvents(game, result.events);
  const played = uno.isWild(result.card)
    ? `${uno.cardLabel(result.card)} → warna ${uno.COLOR_EMOJI[game.currentColor]} ${uno.COLOR_NAME[game.currentColor]}`
    : uno.cardLabel(result.card);
  const header = [`🃏 ${tag(sender)} memainkan ${played}`, ...lines];
  if (game.unoWindow) {
    header.push(`🗣️ ${tag(sender)} tinggal *1 kartu*! Ketik *uno* sekarang — pemain lain yang mengetik *uno* lebih dulu menangkapmu (denda 2 kartu)!`);
  }
  await announceTurn(deps, from, game, header.join('\n'), [sender, ...mentions]);

  // Korban +2/+4 melihat kartu barunya, lalu pemain yang mendapat giliran.
  for (const event of result.events) {
    if (event.type === 'draw') await sendHand(deps, from, game, event.player, `🃏 Kamu kena +${event.count}! Kartumu sekarang:`);
  }
  const next = uno.currentPlayer(game);
  if (!result.events.some(event => event.type === 'draw' && event.player === next)) {
    await sendHand(deps, from, game, next, '🃏 Giliranmu! Kartumu:');
  }
  return true;
}

async function handleUnoCall(deps, room, game, caller, result, msg) {
  if (result.status === 'none') return false;
  if (result.status === 'safe') {
    await send(deps.sock, room, `🗣️ ${tag(caller)}: *UNO!* Aman, tinggal 1 kartu.`, [caller], msg);
    return true;
  }
  await send(deps.sock, room,
    `🚨 ${tag(result.catcher)} menangkap ${tag(result.victim)} yang lupa bilang UNO!\n${tag(result.victim)} ambil *2 kartu*.`,
    [result.catcher, result.victim], msg);
  await sendHand(deps, room, game, result.victim, '🃏 Kamu tertangkap lupa UNO! Kartumu sekarang:');
  return true;
}

async function replyError(sock, room, game, error, msg) {
  const current = uno.currentPlayer(game);
  const messages = {
    'not-turn': `⏳ Belum giliranmu. Sekarang giliran ${tag(current)}.`,
    'no-card': '❌ Kamu tidak punya kartu itu. Ketik *kartu* untuk melihat kartumu.',
    unplayable: `❌ Kartu itu tidak cocok dengan kartu teratas (${uno.describeTop(game)}).`,
    'need-color': '🌈 Kartu Wild harus menyebut warna. Contoh: *w r* (merah), *w4 b* (biru). Warna: r y g b.',
    'must-play-drawn': '❌ Kamu baru mengambil kartu. Mainkan kartu yang baru diambil itu atau ketik *pass*.',
    'must-draw': '❌ Ambil kartu dulu dengan *draw* sebelum *pass*.',
    'already-drew': '❌ Kamu sudah mengambil kartu. Mainkan kartu itu atau ketik *pass*.',
  };
  await send(sock, room, messages[error] || '❌ Aksi tidak valid.', error === 'not-turn' ? [current] : [], msg);
  return true;
}

// ---------- Command (.uno ...) ----------

const HELP_TEXT = prefix => `🃏 *UNO — CARA MAIN*

*Perintah (dengan prefix)*
• ${prefix}uno — buat lobi
• ${prefix}unojoin — gabung lobi
• ${prefix}unostart — mulai (host, min. ${uno.MIN_PLAYERS} pemain)
• ${prefix}unohand — kirim ulang kartu ke chat pribadi
• ${prefix}unoleave — keluar dari permainan
• ${prefix}unostop — hentikan permainan (host/owner)

*Saat bermain (ketik tanpa prefix di grup)*
• Kartu angka: *r5* (Merah 5), *y0*, *g9*, *b3*
• Skip: *rs* · Reverse: *rv* · +2: *r+2*
• Wild: *w r* · Wild +4: *w4 b* (pilih warna r/y/g/b)
• *draw* ambil kartu · *pass* lewat (setelah draw)
• *uno* — wajib saat tinggal 1 kartu. Siapa cepat mengetik *uno* duluan: kalau pemain itu sendiri = aman, kalau pemain lain = dia kena denda 2 kartu!
• *kartu* — kirim ulang kartumu

Kartu dikirim lewat chat pribadi bot. Kartu bertanda *tebal* = bisa dimainkan.
Pemenang adalah yang kartunya habis duluan.`;

async function handleUnoCommand(sock, msg, args, ctx, subcommand) {
  const { config, from, sender, gameState, isGroup } = ctx;
  const sub = String(subcommand || args[0] || '').toLowerCase();
  const prefix = config.prefix;
  const reply = (text, mentions = []) => send(sock, from, text, mentions, msg);
  const isOwner = typeof ctx.isSenderOwner === 'function' && ctx.isSenderOwner();
  const deps = { ...ctx, sock };

  if (sub === 'help' || sub === 'rules' || sub === 'cara') return reply(HELP_TEXT(prefix));

  // ---- kirim ulang kartu (boleh dari chat pribadi) ----
  if (sub === 'hand' || sub === 'kartu') {
    const found = isGroup(from)
      ? (getGame(ctx)?.players.includes(sender) ? { room: from, game: getGame(ctx) } : null)
      : findGameByPlayer(gameState, sender);
    if (!found) return reply('❌ Kamu tidak sedang ikut permainan UNO.');
    if (found.game.phase !== 'playing') return reply('⏳ Permainan belum dimulai, kartu dibagikan setelah *' + prefix + 'unostart*.');
    const ok = await sendHand(deps, found.room, found.game, sender);
    if (ok && isGroup(from)) await reply('📩 Kartumu sudah dikirim ke chat pribadi.');
    return true;
  }

  if (!isGroup(from)) return reply('❌ UNO hanya bisa dimainkan di grup. Untuk melihat kartu dari chat pribadi: ' + prefix + 'unohand');

  const game = getGame(ctx);

  // ---- buat lobi ----
  if (!sub || sub === 'create' || sub === 'buat' || sub === 'new') {
    if (game) {
      return reply(game.phase === 'lobby'
        ? `🃏 Lobi UNO sudah dibuka oleh ${tag(game.host)}.\nPemain (${game.players.length}): ${game.players.map(tag).join(', ')}\nGabung dengan *${prefix}unojoin*.`
        : `🃏 UNO sedang berjalan.\nKartu teratas: ${uno.describeTop(game)}\nGiliran: ${tag(uno.currentPlayer(game))}\n${uno.renderScoreboard(game)}`,
      game.players);
    }
    if (gameState[from]) return reply('❌ Masih ada permainan lain yang aktif di grup ini.');
    if (!ctx.user.registered && !isOwner) return reply(`❌ Daftar dulu dengan *${prefix}daftar <nama>* sebelum bermain UNO.`);

    const lobby = uno.createGame({ host: sender, hostName: ctx.pushName });
    gameState[from] = lobby;
    armTimer(deps, from, lobby);
    return reply(
      `🃏 *UNO — LOBI DIBUKA*\n\nHost: ${tag(sender)}\nPemain: 1/${uno.MAX_PLAYERS}\n\n` +
      `• Gabung: *${prefix}unojoin*\n• Mulai: *${prefix}unostart* (min. ${uno.MIN_PLAYERS} pemain)\n• Cara main: *${prefix}uno help*\n\n` +
      `⏱️ Lobi ditutup otomatis jika tidak ada aktivitas ${formatDuration(turnMs(config))}.`,
      [sender]);
  }

  if (!game) return reply(`❌ Belum ada lobi UNO. Buat dengan *${prefix}uno*.`);

  // ---- gabung ----
  if (sub === 'join' || sub === 'gabung' || sub === 'ikut') {
    if (!ctx.user.registered && !isOwner) return reply(`❌ Daftar dulu dengan *${prefix}daftar <nama>* untuk ikut UNO.`);
    const result = uno.addPlayer(game, sender, ctx.pushName);
    if (!result.ok) {
      const errors = {
        started: '❌ Permainan sudah dimulai.',
        already: '✅ Kamu sudah ada di lobi.',
        full: `❌ Lobi penuh (maks. ${uno.MAX_PLAYERS} pemain).`,
      };
      return reply(errors[result.error]);
    }
    armTimer(deps, from, game);
    return reply(`✅ ${tag(sender)} bergabung!\nPemain (${game.players.length}/${uno.MAX_PLAYERS}): ${game.players.map(tag).join(', ')}`, game.players);
  }

  // ---- mulai ----
  if (sub === 'start' || sub === 'mulai') {
    if (game.phase !== 'lobby') return reply('❌ Permainan sudah berjalan.');
    if (sender !== game.host && !isOwner) return reply(`❌ Hanya host (${tag(game.host)}) yang bisa memulai.`, [game.host]);
    const result = uno.startGame(game);
    if (!result.ok) return reply(`❌ Butuh minimal ${uno.MIN_PLAYERS} pemain. Ajak teman dengan *${prefix}unojoin*.`);
    await sendHandsToAll(deps, from, game);
    await announceTurn(deps, from, game,
      `🃏 *UNO DIMULAI!* ${game.players.length} pemain, masing-masing ${uno.HAND_SIZE} kartu.\nKartu pembuka: ${uno.cardLabel(result.first)}\n\n📩 Kartu dikirim lewat chat pribadi bot.`);
    return true;
  }

  // ---- keluar ----
  if (sub === 'leave' || sub === 'keluar') {
    if (!game.players.includes(sender)) return reply('❌ Kamu tidak ikut permainan ini.');
    uno.removePlayer(game, sender);
    if (!game.players.length || (game.phase === 'playing' && game.players.length < uno.MIN_PLAYERS)) {
      clearUnoTimer(game);
      delete gameState[from];
      return reply(`🚪 ${tag(sender)} keluar. Pemain kurang dari ${uno.MIN_PLAYERS}, permainan UNO dibatalkan.`, [sender]);
    }
    if (game.phase === 'lobby') {
      return reply(`🚪 ${tag(sender)} keluar dari lobi.\nHost sekarang: ${tag(game.host)}`, [sender, game.host]);
    }
    await announceTurn(deps, from, game, `🚪 ${tag(sender)} keluar dari permainan.`, [sender]);
    await sendHand(deps, from, game, uno.currentPlayer(game), '🃏 Giliranmu! Kartumu:');
    return true;
  }

  // ---- stop ----
  if (sub === 'stop' || sub === 'end' || sub === 'batal') {
    if (sender !== game.host && !isOwner) return reply(`❌ Hanya host (${tag(game.host)}) atau owner yang bisa menghentikan UNO.`, [game.host]);
    clearUnoTimer(game);
    delete gameState[from];
    return reply('🛑 Permainan UNO dihentikan.');
  }

  return reply(HELP_TEXT(prefix));
}

module.exports = {
  handleUnoInput,
  handleUnoCommand,
  findGameByPlayer,
  clearUnoTimer,
  HELP_TEXT,
};
