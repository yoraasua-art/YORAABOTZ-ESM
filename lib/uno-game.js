// ============================================================
//   UNO — logika permainan (murni, tanpa I/O supaya mudah dites)
//
//   Kode kartu yang diketik pemain (tanpa prefix):
//     r5   = Merah 5        rs  = Merah Skip      rv  = Merah Reverse
//     r+2  = Merah +2       w r = Wild pilih Merah w4 g = Wild +4 pilih Hijau
//   Warna: r (merah) y (kuning) g (hijau) b (biru)
// ============================================================

const COLORS = ['r', 'y', 'g', 'b'];
const COLOR_NAME = { r: 'Merah', y: 'Kuning', g: 'Hijau', b: 'Biru' };
const COLOR_EMOJI = { r: '🔴', y: '🟡', g: '🟢', b: '🔵' };
const COLOR_WORDS = {
  r: 'r', merah: 'r', red: 'r',
  y: 'y', kuning: 'y', yellow: 'y',
  g: 'g', hijau: 'g', green: 'g',
  b: 'b', biru: 'b', blue: 'b',
};
const SPECIALS = ['skip', 'rev', '+2'];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const HAND_SIZE = 7;
const MAX_IDLE_TURNS = 2;

// ---------- Kartu ----------

function isWild(card) { return card.value === 'w' || card.value === 'w4'; }

function cardCode(card) {
  if (isWild(card)) return card.value;
  const short = { skip: 's', rev: 'v', '+2': '+2' }[card.value] || card.value;
  return card.color + short;
}

function cardLabel(card) {
  if (card.value === 'w') return '🌈 Wild';
  if (card.value === 'w4') return '🌈 Wild +4';
  const symbol = { skip: '⛔', rev: '🔄', '+2': '➕2' }[card.value] || card.value;
  return `${COLOR_EMOJI[card.color]}${symbol}`;
}

function buildDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ color, value: '0' });
    for (let n = 1; n <= 9; n++) deck.push({ color, value: String(n) }, { color, value: String(n) });
    for (const value of SPECIALS) deck.push({ color, value }, { color, value });
  }
  for (let i = 0; i < 4; i++) deck.push({ color: null, value: 'w' }, { color: null, value: 'w4' });
  return deck;
}

function shuffle(list, rng = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- Parsing input pemain ----------

const COLOR_PATTERN = '(r|y|g|b|merah|kuning|hijau|biru|red|yellow|green|blue)';
const WILD_RE = new RegExp(`^(?:wild|w)(\\+?4)?${COLOR_PATTERN}?$`);
const VALUE_PATTERN = '(\\d|skip|s|reverse|rev|rv|v|\\+2|d2|draw2)';
const CARD_RE = new RegExp(`^${COLOR_PATTERN}${VALUE_PATTERN}$`);

/** Ubah teks pemain jadi { wild, wild4, color } / { color, value } / null. */
function parseCardInput(text) {
  const compact = String(text ?? '').toLowerCase().replace(/[\s_-]+/g, '');
  if (!compact || compact.length > 14) return null;

  const wild = compact.match(WILD_RE);
  if (wild) {
    return { wild: true, value: wild[1] ? 'w4' : 'w', chosenColor: wild[2] ? COLOR_WORDS[wild[2]] : null };
  }

  const card = compact.match(CARD_RE);
  if (!card) return null;
  const value = { s: 'skip', skip: 'skip', v: 'rev', rv: 'rev', rev: 'rev', reverse: 'rev', d2: '+2', draw2: '+2', '+2': '+2' }[card[2]] || card[2];
  return { wild: false, color: COLOR_WORDS[card[1]], value };
}

// ---------- State ----------

function createGame({ host, hostName }) {
  return {
    game: 'uno',
    phase: 'lobby',
    host,
    players: [host],
    names: { [host]: hostName || 'Host' },
    hands: {},
    deck: [],
    discard: [],
    currentColor: null,
    turn: 0,
    dir: 1,
    drawn: null,
    unoWindow: null,
    idle: {},
    timer: null,
    sender: host,
  };
}

function addPlayer(game, jid, name) {
  if (game.phase !== 'lobby') return { ok: false, error: 'started' };
  if (game.players.includes(jid)) return { ok: false, error: 'already' };
  if (game.players.length >= MAX_PLAYERS) return { ok: false, error: 'full' };
  game.players.push(jid);
  game.names[jid] = name || 'Pemain';
  return { ok: true };
}

function topCard(game) { return game.discard[game.discard.length - 1]; }
function currentPlayer(game) { return game.players[game.turn]; }

function playerAt(game, steps) {
  const n = game.players.length;
  return game.players[(((game.turn + game.dir * steps) % n) + n) % n];
}

function advance(game, steps = 1) {
  const n = game.players.length;
  game.turn = (((game.turn + game.dir * steps) % n) + n) % n;
}

function drawFromDeck(game, rng = Math.random) {
  if (!game.deck.length && game.discard.length > 1) {
    const top = game.discard.pop();
    game.deck = shuffle(game.discard, rng);
    game.discard = [top];
  }
  return game.deck.pop() || null;
}

function drawCards(game, jid, count, rng = Math.random) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    const card = drawFromDeck(game, rng);
    if (!card) break;
    game.hands[jid].push(card);
    drawn.push(card);
  }
  return drawn;
}

function startGame(game, rng = Math.random) {
  if (game.phase !== 'lobby') return { ok: false, error: 'started' };
  if (game.players.length < MIN_PLAYERS) return { ok: false, error: 'few-players' };

  game.deck = shuffle(buildDeck(), rng);
  for (const jid of game.players) {
    game.hands[jid] = [];
    drawCards(game, jid, HAND_SIZE, rng);
  }

  // Kartu pembuka harus kartu angka biasa.
  let first = game.deck.pop();
  while (isWild(first) || SPECIALS.includes(first.value)) {
    game.deck.unshift(first);
    first = game.deck.pop();
  }
  game.discard = [first];
  game.currentColor = first.color;
  game.phase = 'playing';
  game.turn = 0;
  game.dir = 1;
  game.drawn = null;
  game.unoWindow = null;
  return { ok: true, first };
}

function isPlayable(game, card) {
  if (isWild(card)) return true;
  return card.color === game.currentColor || card.value === topCard(game).value;
}

function playableCards(game, jid) {
  const hand = game.hands[jid] || [];
  if (game.drawn && currentPlayer(game) === jid) return hand.filter(card => card === game.drawn && isPlayable(game, card));
  return hand.filter(card => isPlayable(game, card));
}

function findInHand(game, jid, parsed) {
  return game.hands[jid].findIndex(card => (parsed.wild
    ? card.value === parsed.value
    : card.color === parsed.color && card.value === parsed.value));
}

// ---------- Aksi ----------

/**
 * Mainkan kartu. Hasil: { ok:false, error } atau
 * { ok:true, card, events, winner?, next? }
 * events: { type:'skip'|'reverse'|'draw', player?, count? }
 */
function playCard(game, jid, parsed, rng = Math.random) {
  if (game.phase !== 'playing') return { ok: false, error: 'not-playing' };
  if (currentPlayer(game) !== jid) return { ok: false, error: 'not-turn' };

  const index = findInHand(game, jid, parsed);
  if (index === -1) return { ok: false, error: 'no-card' };
  const card = game.hands[jid][index];
  if (game.drawn && game.drawn !== card) return { ok: false, error: 'must-play-drawn' };
  if (!isPlayable(game, card)) return { ok: false, error: 'unplayable' };
  if (isWild(card) && !parsed.chosenColor) return { ok: false, error: 'need-color' };

  game.unoWindow = null;
  game.idle[jid] = 0;
  game.hands[jid].splice(index, 1);
  game.discard.push(card);
  game.drawn = null;
  game.currentColor = isWild(card) ? parsed.chosenColor : card.color;

  const events = [];
  if (game.hands[jid].length === 0) return { ok: true, card, events, winner: jid };
  if (game.hands[jid].length === 1) game.unoWindow = { player: jid };

  let steps = 1;
  const twoPlayers = game.players.length === 2;
  if (card.value === 'skip') {
    events.push({ type: 'skip', player: playerAt(game, 1) });
    steps = 2;
  } else if (card.value === 'rev') {
    game.dir *= -1;
    events.push({ type: 'reverse' });
    if (twoPlayers) steps = 2; // 2 pemain: Reverse = Skip
  } else if (card.value === '+2' || card.value === 'w4') {
    const victim = playerAt(game, 1);
    const count = card.value === '+2' ? 2 : 4;
    drawCards(game, victim, count, rng);
    events.push({ type: 'draw', player: victim, count });
    steps = 2;
  }
  advance(game, steps);
  return { ok: true, card, events, next: currentPlayer(game) };
}

function drawCard(game, jid, rng = Math.random) {
  if (game.phase !== 'playing') return { ok: false, error: 'not-playing' };
  if (currentPlayer(game) !== jid) return { ok: false, error: 'not-turn' };
  if (game.drawn) return { ok: false, error: 'already-drew' };

  game.unoWindow = null;
  game.idle[jid] = 0;
  const [card] = drawCards(game, jid, 1, rng);
  if (!card) {
    advance(game, 1);
    return { ok: true, card: null, playable: false, next: currentPlayer(game) };
  }
  if (isPlayable(game, card)) {
    game.drawn = card;
    return { ok: true, card, playable: true, next: jid };
  }
  advance(game, 1);
  return { ok: true, card, playable: false, next: currentPlayer(game) };
}

function passTurn(game, jid) {
  if (game.phase !== 'playing') return { ok: false, error: 'not-playing' };
  if (currentPlayer(game) !== jid) return { ok: false, error: 'not-turn' };
  if (!game.drawn) return { ok: false, error: 'must-draw' };
  game.unoWindow = null;
  game.drawn = null;
  game.idle[jid] = 0;
  advance(game, 1);
  return { ok: true, next: currentPlayer(game) };
}

/** Pemain mengetik "uno": aman bila dia sendiri, kena denda 2 kartu bila ditangkap orang lain. */
function callUno(game, caller, rng = Math.random) {
  const window = game.unoWindow;
  if (game.phase !== 'playing' || !window) return { status: 'none' };
  game.unoWindow = null;
  if (caller === window.player) return { status: 'safe', player: caller };
  drawCards(game, window.player, 2, rng);
  return { status: 'caught', victim: window.player, catcher: caller };
}

function removePlayer(game, jid) {
  const index = game.players.indexOf(jid);
  if (index === -1) return { ok: false };
  const hand = game.hands[jid] || [];
  game.deck.unshift(...hand);
  delete game.hands[jid];
  delete game.idle[jid];
  const wasCurrent = game.phase === 'playing' && index === game.turn;

  game.players.splice(index, 1);
  if (game.unoWindow?.player === jid) game.unoWindow = null;
  if (game.host === jid) game.host = game.players[0] || null;

  if (game.phase === 'playing' && game.players.length) {
    const n = game.players.length;
    if (index < game.turn) game.turn -= 1;
    else if (wasCurrent && game.dir === -1) game.turn -= 1;
    game.turn = ((game.turn % n) + n) % n;
    if (wasCurrent) game.drawn = null;
  }
  return { ok: true, wasCurrent };
}

/** Giliran habis: ambil 1 kartu & lewat. Dua kali berturut-turut -> dikeluarkan. */
function handleTurnTimeout(game, rng = Math.random) {
  const jid = currentPlayer(game);
  game.unoWindow = null;
  if (game.drawn) {
    game.drawn = null;
  } else {
    drawCards(game, jid, 1, rng);
  }
  game.idle[jid] = (game.idle[jid] || 0) + 1;

  if (game.idle[jid] >= MAX_IDLE_TURNS) {
    removePlayer(game, jid);
    return { jid, kicked: true, remaining: game.players.length };
  }
  advance(game, 1);
  return { jid, kicked: false, remaining: game.players.length };
}

function sortHand(hand) {
  const order = { r: 0, y: 1, g: 2, b: 3 };
  const rank = card => {
    if (isWild(card)) return 100 + (card.value === 'w4' ? 1 : 0);
    const numeric = /^\d$/.test(card.value);
    return order[card.color] * 20 + (numeric ? Number(card.value) : 10 + SPECIALS.indexOf(card.value));
  };
  return [...hand].sort((a, b) => rank(a) - rank(b));
}

function renderHand(game, jid) {
  const hand = sortHand(game.hands[jid] || []);
  const playable = new Set(playableCards(game, jid));
  const mark = card => (playable.has(card) ? `*${cardCode(card)}*` : cardCode(card));
  const lines = [];
  for (const color of COLORS) {
    const cards = hand.filter(card => card.color === color);
    if (cards.length) lines.push(`${COLOR_EMOJI[color]} ${cards.map(mark).join('  ')}`);
  }
  const wilds = hand.filter(isWild);
  if (wilds.length) lines.push(`🌈 ${wilds.map(mark).join('  ')}`);
  return lines.join('\n') || '(kosong)';
}

function renderScoreboard(game) {
  return game.players.map(jid => `@${jid.split('@')[0]} ${game.hands[jid]?.length ?? 0}🃏`).join(' · ');
}

function describeTop(game) {
  const top = topCard(game);
  return `${cardLabel(top)} · warna aktif ${COLOR_EMOJI[game.currentColor]} ${COLOR_NAME[game.currentColor]}`;
}

module.exports = {
  COLORS, COLOR_NAME, COLOR_EMOJI, MIN_PLAYERS, MAX_PLAYERS, HAND_SIZE, MAX_IDLE_TURNS,
  isWild, cardCode, cardLabel, buildDeck, shuffle, parseCardInput,
  createGame, addPlayer, startGame, topCard, currentPlayer, playerAt, advance,
  isPlayable, playableCards, playCard, drawCard, drawCards, passTurn, callUno,
  removePlayer, handleTurnTimeout, renderHand, renderScoreboard, describeTop, sortHand,
};
