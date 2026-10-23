// ============================================================
//   GAME ENGINE — mode REBUTAN
//   Semua game tebak-tebakan dijawab langsung di chat oleh SIAPA PUN
//   di grup. Yang jawab benar paling cepat menang.
// ============================================================

// Game sesi (multi-pemain) yang punya handler sendiri, bukan tebak-tebakan.
const gameStats = require('./game-stats');

const SESSION_GAMES = new Set(['ttt', 'ttt-pending', 'uno', 'uno-lobby']);

const REWARDS = {
  tebakangka: [5, 500],
  tebakangkasulit: [10, 1500],
  susunkata: [3, 800],
  tekateki: [4, 900],
  tebaklirik: [4, 900],
  tebakkalimat: [3, 800],
  quiz: [10, 1000],
  tebakkata: [3, 750],
  math: [3, 800],
  tebakemoji: [3, 800],
  hangman: [5, 1000],
  tebakibukota: [3, 700],
  tebakfilm: [4, 900],
  tebakpemainbola: [4, 900],
  tebaklagu: [4, 900],
  tebakgambar: [3, 800],
  tebakbendera: [3, 700],
  tebaksurah: [4, 900],
  tebakpresiden: [4, 900],
  tebakplanet: [3, 700],
  tebakanime: [4, 900],
  tebakhewan: [3, 700],
  asahotak: [3, 700],
  siapakahaku: [3, 750],
  caklontong: [3, 800],
  lengkapikalimat: [3, 750],
  family100: [4, 900],
};
const DEFAULT_REWARD = [3, 500];
// Family100: tiap jawaban yang ditemukan memberi hadiah kecil.
const FAMILY_PER_ANSWER = [1, 250];
const FAMILY_BONUS = [2, 500];

function formatDuration(ms) {
  const totalSeconds = Math.max(1, Math.round(Number(ms) / 1000) || 0);
  if (totalSeconds < 60) return `${totalSeconds} detik`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes} menit ${seconds} detik` : `${minutes} menit`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Huruf kecil, tanpa tanda baca, spasi dirapikan. "Kura-kura!" -> "kura kura"
function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,]+$/g, '')
    .trim();
}

// "Rp 1.500" -> "1500", "1,500" tetap "1,500" (bukan angka bulat)
function normalizeNumber(value) {
  let text = String(value ?? '').toLowerCase().replace(/rp/g, '').replace(/\s+/g, '');
  if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  return text;
}

function isIntegerAnswer(text) {
  return /^-?\d+$/.test(text);
}

// Apakah `input` cocok dengan SATU jawaban `answer`?
function matchesOne(input, answer) {
  const normalizedAnswer = normalizeText(answer);
  if (!normalizedAnswer) return false;

  // Jawaban angka: wajib sama persis (hindari "1" cocok dengan "100").
  if (isIntegerAnswer(normalizedAnswer)) {
    return normalizeNumber(input) === normalizedAnswer;
  }

  const normalizedInput = normalizeText(input);
  if (!normalizedInput) return false;
  if (normalizedInput === normalizedAnswer) return true;

  // Jawaban pendek (mis. "o", "au", "fe") hanya boleh cocok persis,
  // supaya obrolan biasa tidak ikut "menjawab".
  if (normalizedAnswer.length < 4) return false;

  // Boleh ada kata tambahan ("jawabannya jakarta"), tapi batasi panjangnya
  // dan wajib cocok per kata utuh.
  const answerWords = normalizedAnswer.split(' ').length;
  const inputWords = normalizedInput.split(' ').length;
  if (inputWords > answerWords + 3) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedAnswer)}(\\s|$)`);
  return pattern.test(normalizedInput);
}

// Index jawaban yang cocok di daftar, atau -1.
function findAnswerIndex(input, answers) {
  const list = Array.isArray(answers) ? answers : [answers];
  return list.findIndex(answer => matchesOne(input, answer));
}

function matchesAnswer(input, answers) {
  return findAnswerIndex(input, answers) !== -1;
}

function numberOf(jid) {
  return String(jid).split('@')[0].split(':')[0];
}

function revealAnswer(game) {
  if (game.game === 'tebakangka') return game.angka;
  if (game.game === 'hangman') return game.kata;
  if (Array.isArray(game.jawab)) return game.jawab[0];
  return game.jawab;
}

function isGuessGame(game) {
  if (!game || SESSION_GAMES.has(game.game)) return false;
  return game.jawab !== undefined || game.angka !== undefined || game.kata !== undefined;
}

function isSkipWord(lower) {
  return lower === 'nyerah' || lower === 'menyerah' || lower === 'giveup' || lower === 'skip';
}

function renderFamilyBoard(game) {
  const mentions = [];
  const lines = game.jawab.map((answer, index) => {
    const finder = game.found?.[index];
    if (!finder) return `▫️ ${index + 1}. ______`;
    mentions.push(finder);
    return `✅ ${index + 1}. *${answer}* — @${numberOf(finder)}`;
  });
  return { text: lines.join('\n'), mentions };
}

// ============================================================
//   RESPON JAWABAN SALAH
// ============================================================

const WRONG_DEFAULTS = { enabled: true, cooldown: 3000, hintAfter: 3 };
const WRONG_HEADERS = ['❌ *SALAH!*', '🙅 *Bukan itu!*', '😅 *Masih salah!*', '🤔 *Kurang tepat!*', '❎ *Belum benar!*'];
const wrongCooldowns = new Map();

function wrongSettings(config) {
  return { ...WRONG_DEFAULTS, ...(config?.gameWrongAnswer || {}) };
}

function acceptedAnswers(game) {
  if (game.game === 'tebakangka') return [String(game.angka)];
  if (game.game === 'hangman') return [game.kata];
  return (Array.isArray(game.jawab) ? game.jawab : [game.jawab]).map(String);
}

function isNumericGame(game) {
  const answers = acceptedAnswers(game);
  return answers.length > 0 && answers.every(answer => isIntegerAnswer(normalizeText(answer)));
}

function isReplyToBot(deps) {
  const context = deps.msg?.message?.extendedTextMessage?.contextInfo;
  if (!context?.quotedMessage || !context.participant) return false;
  const quoted = numberOf(context.participant);
  return (deps.botIds || []).some(id => id && numberOf(id) === quoted);
}

// Apakah pesan (yang tidak cocok) kemungkinan besar adalah upaya menjawab,
// bukan obrolan biasa? Hanya upaya menjawab yang dibalas "salah".
function looksLikeAttempt(game, input, deps) {
  if (deps.forceAttempt) return true;
  if (/https?:\/\/|www\./i.test(input)) return false;
  const normalized = normalizeText(input);
  if (!normalized) return false;

  if (isNumericGame(game)) {
    return isIntegerAnswer(normalizeNumber(input)) || /^-?[\d.,\s]+$/.test(input);
  }
  const isPrivate = deps.isGroup === false || (deps.isGroup === undefined && !String(deps.from).endsWith('@g.us'));
  if (isPrivate || isReplyToBot(deps)) return true;
  if (input.length > 40) return false;
  const maxWords = Math.max(1, ...acceptedAnswers(game).map(answer => normalizeText(answer).split(' ').length));
  return normalized.split(' ').length <= maxWords + 2;
}

// Petunjuk huruf: tiap `hintAfter` kali salah, satu huruf lagi dibuka.
function buildHint(game, wrongCount, hintAfter) {
  if (!hintAfter || wrongCount < hintAfter) return '';
  const answer = String(revealAnswer(game) ?? '');
  if (!answer) return '';
  if (isIntegerAnswer(normalizeText(answer))) {
    const digits = answer.replace('-', '').length;
    return `💡 Petunjuk: jawabannya angka *${digits} digit*${answer.startsWith('-') ? ' (negatif)' : ''}.`;
  }
  const letters = [...answer].filter(char => /[\p{L}\p{N}]/u.test(char)).length;
  const maxOpen = Math.max(1, letters - 2);
  const open = Math.min(Math.floor(wrongCount / hintAfter), maxOpen);
  let shown = 0;
  const masked = [...answer].map(char => {
    if (char === ' ') return '   ';
    if (!/[\p{L}\p{N}]/u.test(char)) return char;
    shown++;
    return shown <= open ? char.toUpperCase() : '_';
  }).join(' ');
  return `💡 Petunjuk: \`${masked}\` (${letters} huruf)`;
}

function shortInput(input) {
  const clean = String(input).replace(/\s+/g, ' ').trim();
  return clean.length > 30 ? clean.slice(0, 30) + '…' : clean;
}

// Kirim balasan "salah". Return true bila pesan dianggap upaya menjawab.
async function replyWrongAnswer(deps, game, input, extraLine = '') {
  const { sock, msg, from, sender, config } = deps;
  const settings = wrongSettings(config);
  if (!settings.enabled && !deps.forceAttempt) return false;
  if (!looksLikeAttempt(game, input, deps)) return false;

  game.wrongCount = (game.wrongCount || 0) + 1;
  game.wrongBy = game.wrongBy || {};
  game.wrongBy[sender] = (game.wrongBy[sender] || 0) + 1;

  const key = `${from}|${sender}`;
  const now = Date.now();
  if (!deps.forceAttempt && now - (wrongCooldowns.get(key) || 0) < settings.cooldown) return true;
  wrongCooldowns.set(key, now);
  if (wrongCooldowns.size > 500) {
    for (const [k, time] of wrongCooldowns) if (now - time > 60000) wrongCooldowns.delete(k);
  }

  const header = WRONG_HEADERS[(game.wrongCount - 1) % WRONG_HEADERS.length];
  const hint = buildHint(game, game.wrongCount, settings.hintAfter);
  const skip = game.sender === sender ? 'Ketik *nyerah* untuk skip.' : 'Pemilik soal bisa ketik *nyerah* untuk skip.';
  const lines = [
    `${header} @${numberOf(sender)}`,
    `Jawaban *${shortInput(input)}* belum tepat.`,
    extraLine,
    hint,
    '',
    `_Ayo coba lagi! (salah ke-${game.wrongBy[sender]})_ · ${skip}`,
  ].filter((line, index) => line !== '' || index === 4);
  await sock.sendMessage(from, { text: lines.join('\n'), mentions: [sender] }, msg?.key ? { quoted: msg } : undefined);
  return true;
}

function numberHint(game, input) {
  const guess = Number(normalizeNumber(input));
  if (!Number.isFinite(guess)) return '';
  if (game.game === 'tebakangka') {
    const max = game.max || 10;
    if (guess < 1 || guess > max) return `📏 Angkanya hanya antara *1 – ${max}*.`;
    return guess < game.angka ? `📈 Terlalu kecil! Angkanya *lebih besar* dari ${guess}.` : `📉 Terlalu besar! Angkanya *lebih kecil* dari ${guess}.`;
  }
  return '';
}

/**
 * Proses sebuah pesan sebagai jawaban game rebutan.
 * Mengembalikan true bila pesan dipakai (tidak diproses lebih lanjut).
 *
 * deps: { sock, msg, from, sender, text, gameState, clearGameTimeout,
 *         getUser, updateUser, formatMoney, config, isOwnerSender }
 */
async function handleGameAnswer(deps) {
  const {
    sock, msg, from, sender, text, gameState, clearGameTimeout,
    getUser, updateUser, formatMoney, config, isOwnerSender,
  } = deps;
  const game = gameState[from];
  if (!isGuessGame(game)) return false;

  const input = String(text ?? '').trim();
  if (!input) return false;
  const lower = input.toLowerCase();

  // ---- NYERAH: hanya pemilik soal (atau owner bot) ----
  if (isSkipWord(lower)) {
    if (game.sender && game.sender !== sender && !isOwnerSender) return false;
    clearGameTimeout(from);
    delete gameState[from];
    const lines = game.multi
      ? `Jawaban yang belum ketemu:\n${game.jawab.filter((_, i) => !game.found?.[i]).map(a => `• ${a}`).join('\n') || '-'}`
      : `Jawaban: *${revealAnswer(game)}*`;
    await sock.sendMessage(from, { text: `🏳️ *NYERAH!*\n\n${lines}\n\n_Coba lagi kapan-kapan!_` });
    return true;
  }

  // Kata di awal pesan berprefix = command, bukan jawaban.
  if (!deps.forceAttempt && config?.prefix && input.startsWith(config.prefix)) return false;

  // ---- HANGMAN (rebutan huruf / tebak langsung kata) ----
  if (game.game === 'hangman') {
    const isLetter = lower.length === 1 && /[a-z]/.test(lower);
    const isWholeWord = !isLetter && normalizeText(lower) === game.kata;
    if (!isLetter && !isWholeWord) {
      const isWordGuess = /^[a-z]{2,}$/.test(normalizeText(lower)) && lower.length <= game.kata.length + 3;
      if (!isWordGuess && !deps.forceAttempt) return false;
      return replyWrongAnswer(deps, game, input, `Kata yang dicari terdiri dari *${game.kata.length} huruf*.`);
    }
    if (isLetter && game.tebakan.includes(lower)) {
      await sock.sendMessage(from, {
        text: `⚠️ @${numberOf(sender)} huruf *${lower.toUpperCase()}* sudah ditebak!
Huruf terpakai: ${game.tebakan.join(', ')}`,
        mentions: [sender],
      }, msg?.key ? { quoted: msg } : undefined);
      return true;
    }

    let letterNote = '';
    if (isLetter) {
      game.tebakan.push(lower);
      if (game.kata.includes(lower)) {
        letterNote = `✅ Huruf *${lower.toUpperCase()}* ada!\n\n`;
      } else {
        game.nyawa--;
        letterNote = `❌ *SALAH!* Huruf *${lower.toUpperCase()}* tidak ada. Nyawa berkurang!\n\n`;
      }
    }
    const tampil = game.kata.split('').map(c => (game.tebakan.includes(c) || isWholeWord ? c : '_')).join(' ');
    const nyawaBar = '❤️'.repeat(Math.max(0, game.nyawa)) + '🖤'.repeat(Math.max(0, 6 - game.nyawa));

    if (game.nyawa <= 0) {
      clearGameTimeout(from);
      delete gameState[from];
      await sock.sendMessage(from, { text: `💀 *GAME OVER!*\nKata: *${game.kata}*` });
      return true;
    }
    if (isWholeWord || !tampil.includes('_')) {
      await rewardWinner(deps, game, 'hangman');
      return true;
    }
    await sock.sendMessage(from, {
      mentions: [sender],
      text: `${letterNote}🎯 *HANGMAN*\n\nKata: ${tampil}\nNyawa: ${nyawaBar}\nHuruf: ${game.tebakan.join(', ')}\n\n_Siapa pun boleh menebak!_`,
    });
    return true;
  }

  // ---- FAMILY 100 (banyak jawaban, direbut satu per satu) ----
  if (game.multi) {
    game.found = game.found || {};
    const index = game.jawab.findIndex((answer, i) => !game.found[i] && matchesOne(input, answer));
    if (index === -1) {
      const takenIndex = game.jawab.findIndex((answer, i) => game.found[i] && matchesOne(input, answer));
      if (takenIndex !== -1) {
        const finder = game.found[takenIndex];
        await sock.sendMessage(from, {
          text: `⚠️ @${numberOf(sender)} jawaban *${game.jawab[takenIndex]}* sudah direbut @${numberOf(finder)}! Cari jawaban lain.`,
          mentions: [...new Set([sender, finder])],
        }, msg?.key ? { quoted: msg } : undefined);
        return true;
      }
      const left = game.jawab.filter((_, i) => !game.found[i]).length;
      return replyWrongAnswer(deps, game, input, `Masih ada *${left} jawaban* yang belum ketemu.`);
    }
    // Tidak boleh ada `await` antara pencocokan jawaban dan penandaan pemenang,
    // supaya dua penjawab bersamaan tidak sama-sama dihitung.
    if (!isEligible(deps)) {
      await rejectUnregistered(deps);
      return true;
    }
    game.found[index] = sender;
    const user = getUser(sender);
    updateUser(sender, {
      point: user.point + FAMILY_PER_ANSWER[0],
      money: user.money + FAMILY_PER_ANSWER[1],
    });
    const done = game.jawab.every((_, i) => game.found[i]);
    const board = renderFamilyBoard(game);
    if (done) {
      clearGameTimeout(from);
      delete gameState[from];
      const latest = getUser(sender);
      updateUser(sender, { point: latest.point + FAMILY_BONUS[0], money: latest.money + FAMILY_BONUS[1] });
      trackWin(deps, 'family100');
    }
    await sock.sendMessage(from, {
      text: `👨‍👩‍👧‍👦 *FAMILY 100*\n${game.q}\n\n${board.text}\n\n` +
        (done
          ? `🎉 *SEMUA JAWABAN KETEMU!*\n@${numberOf(sender)} dapat bonus +${FAMILY_BONUS[0]} Point, +${formatMoney(FAMILY_BONUS[1])}`
          : `@${numberOf(sender)} +${FAMILY_PER_ANSWER[0]} Point, +${formatMoney(FAMILY_PER_ANSWER[1])}`),
      mentions: [...new Set([...board.mentions, sender])],
    });
    return true;
  }

  // ---- GAME JAWABAN TUNGGAL ----
  const accepted = game.game === 'tebakangka' ? [String(game.angka)] : game.jawab;
  if (!matchesAnswer(input, accepted)) {
    return replyWrongAnswer(deps, game, input, numberHint(game, input));
  }
  await rewardWinner(deps, game, game.game);
  return true;
}

// Sinkron — jangan diubah jadi async (lihat catatan race di handleGameAnswer).
function isEligible(deps) {
  const { sender, getUser, config, isOwnerSender } = deps;
  if (!config?.registrationRequired || isOwnerSender) return true;
  return Boolean(getUser(sender).registered);
}

async function rejectUnregistered(deps) {
  const { sock, from, sender, config, msg } = deps;
  await sock.sendMessage(from, {
    text: `⚠️ @${numberOf(sender)} jawabanmu benar, tapi kamu belum terdaftar!\nKetik *${config.prefix}daftar <nama>* dulu, lalu rebut soal berikutnya.`,
    mentions: [sender],
  }, msg ? { quoted: msg } : undefined);
}

function trackWin(deps, gameName) {
  try {
    gameStats.recordWin(deps, deps.sender, gameName);
  } catch (error) {
    console.error('Statistik game gagal disimpan:', error.message);
  }
}

// Beri hadiah ke pemenang & akhiri game. Return false bila pemenang belum terdaftar.
async function rewardWinner(deps, game, gameName) {
  const { sock, msg, from, sender, gameState, clearGameTimeout, getUser, updateUser, formatMoney } = deps;
  if (!isEligible(deps)) {
    await rejectUnregistered(deps);
    return false;
  }

  // Hapus state SEBELUM await apa pun — penjawab tercepat menang, sisanya telat.
  clearGameTimeout(from);
  delete gameState[from];

  const [point, money] = game.reward || REWARDS[gameName] || DEFAULT_REWARD;
  const user = getUser(sender);
  updateUser(sender, { point: user.point + point, money: user.money + money });
  trackWin(deps, gameName);

  const answer = revealAnswer(game);
  const answerLine = gameName === 'hangman' || answer === undefined ? `Kata: *${game.kata}*` : `Jawaban: *${answer}*`;
  await sock.sendMessage(from, {
    text: `🎉 *BENAR!* @${numberOf(sender)} paling cepat!\n\n${answerLine}\n\n+${point} Point\n+${formatMoney(money)}`,
    mentions: [sender],
  }, msg ? { quoted: msg } : undefined);
  return true;
}

// Dipakai command lama (.jawab, .jawabquiz, .tebak, dst.) supaya hasilnya
// sama dengan menjawab langsung di chat — termasuk balasan saat salah.
async function answerFromCommand(sock, msg, args, ctx, options = {}) {
  const { from, gameState, config } = ctx;
  const game = gameState[from];
  const allowed = options.games;
  if (!isGuessGame(game) || (allowed && !allowed.includes(game.game))) {
    return sock.sendMessage(from, { text: options.noGameText || '❌ Tidak ada game tebak-tebakan yang aktif.' }, { quoted: msg });
  }
  const text = args.join(' ').trim();
  if (!text) {
    return sock.sendMessage(from, { text: `❌ Masukkan jawabanmu!\\nContoh: *${config.prefix}${options.command || 'jawab'} jawaban*\\n_Atau ketik jawaban langsung di chat tanpa prefix._` }, { quoted: msg });
  }
  const handled = await handleGameAnswer({
    sock, msg, from, sender: ctx.sender, text,
    gameState, clearGameTimeout: ctx.clearGameTimeout,
    getUser: ctx.getUser, updateUser: ctx.updateUser, loadDB: ctx.loadDB,
    formatMoney: ctx.formatMoney || (n => 'Rp ' + Number(n).toLocaleString('id-ID')),
    config,
    isOwnerSender: typeof ctx.isSenderOwner === 'function' && ctx.isSenderOwner(),
    forceAttempt: true,
  });
  if (!handled) {
    await sock.sendMessage(from, { text: '❌ Jawaban tidak bisa diproses. Coba ketik jawabanmu langsung di chat.' }, { quoted: msg });
  }
}

module.exports = {
  SESSION_GAMES,
  answerFromCommand,
  replyWrongAnswer,
  looksLikeAttempt,
  buildHint,
  REWARDS,
  formatDuration,
  normalizeText,
  normalizeNumber,
  matchesOne,
  matchesAnswer,
  findAnswerIndex,
  isGuessGame,
  handleGameAnswer,
  revealAnswer,
  numberOf,
};
