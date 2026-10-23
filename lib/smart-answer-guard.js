/**
 * ============================================================================
 * SMART GAME ANSWER FILTER, QUESTION BANK EXPANDER & COMMAND REGISTRY SYNC
 * ============================================================================
 * 1. Mencegah bot menyalahkan user ("🤔 Kurang tepat! Jawaban wkwk belum tepat")
 *    ketika user mengetik obrolan biasa ("apa", "gatau", "wkwk", "haha", "lah", dll).
 * 2. Menambahkan ratusan bank soal baru untuk semua game pertanyaan.
 * 3. Memastikan semua plugin baru otomatis terdaftar di Command Registry & Menu!
 */

const CASUAL_CHAT_BLACKLIST = new Set([
  'apa', 'apaa', 'apaan', 'apah', 'apasi', 'apasih', 'apa ya', 'apa itu', 'apa coba', 'apa sih',
  'gatau', 'ga tau', 'gak tau', 'gk tau', 'enggak tau', 'ndak tau', 'kurang tau', 'ntah', 'entah', 'entahlah', 'mana ku tau', 'mana saya tau',
  'wkwk', 'wkwkwk', 'wkwkwkwk', 'wkwkwkwkwk', 'haha', 'hahaha', 'hahahaha', 'hehe', 'hehehe', 'hihi', 'xixixi', 'awokawok', 'awkawk', 'bjir', 'njir', 'anjir', 'anjay',
  'lah', 'lho', 'loh', 'kok', 'hah', 'ha', 'eh', 'oalah', 'owalah', 'oh', 'oo', 'ooh', 'wah', 'waduh', 'duh', 'yah', 'astaga', 'alamak',
  'bukan', 'au', 'au ah', 'masa', 'mosok', 'serius', 'beneran', 'iyakah', 'masa sih', 'yakin',
  'susah', 'susah banget', 'sulit', 'bingung', 'pusing', 'capek', 'males', 'nyerah aja', 'skip aja',
  'tes', 'test', 'testing', 'cek', 'halo', 'hai', 'p', 'pp', 'ppp', 'bot', 'min', 'admin', 'owner', 'bang', 'kak', 'bro', 'sis',
  'iya', 'ya', 'yup', 'yoi', 'tidak', 'nggak', 'ga', 'gak', 'gk', 'engga', 'enggak', 'kagak', 'nda', 'ndak',
  'siapa', 'dimana', 'kapan', 'kenapa', 'gimana', 'bagaimana', 'berapa', 'yang mana', 'kemana',
  'hmm', 'hm', 'hmmm', 'emmm', 'anu', 'itu', 'ini', 'ok', 'oke', 'okay', 'sip', 'mantap', 'keren', 'gas', 'gasken', 'ayo', 'yok', 'yuk'
]);

const HINT_KEYWORDS = new Set(['hint', 'clue', 'bantu', 'bantuan', 'petunjuk', 'buka']);
const SURRENDER_KEYWORDS = new Set(['nyerah', 'menyerah', 'skip', 'pass', 'lewat', 'stopgame']);

function evaluateGameInput(rawInput, expectedAnswer, options = {}) {
  if (typeof rawInput !== 'string') {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'empty', cleanedInput: '' };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'empty', cleanedInput: '' };
  }

  // 1. Abaikan jika diawali command prefix (. ! / #) kecuali command khusus jawab/nyerah/hint
  if (/^[.!\/#~]/.test(trimmed)) {
    const cmd = trimmed.slice(1).trim().split(/\s+/)[0].toLowerCase();
    if (HINT_KEYWORDS.has(cmd)) {
      return { shouldIgnore: false, isHintRequest: true, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'hint_command', cleanedInput: cmd };
    }
    if (SURRENDER_KEYWORDS.has(cmd)) {
      return { shouldIgnore: false, isHintRequest: false, isSurrenderRequest: true, isCloseAnswer: false, similarity: 0, reason: 'surrender_command', cleanedInput: cmd };
    }
    if (!['jawab', 'tebak', 'ans', 'jwb'].includes(cmd)) {
      return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'bot_command', cleanedInput: trimmed };
    }
  }

  const normalized = trimmed
    .toLowerCase()
    .replace(/[?!.,;:"'`~()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'punctuation_only', cleanedInput: '' };
  }

  if (HINT_KEYWORDS.has(normalized)) {
    return { shouldIgnore: false, isHintRequest: true, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'hint_keyword', cleanedInput: normalized };
  }

  if (SURRENDER_KEYWORDS.has(normalized)) {
    return { shouldIgnore: false, isHintRequest: false, isSurrenderRequest: true, isCloseAnswer: false, similarity: 0, reason: 'surrender_keyword', cleanedInput: normalized };
  }

  const answers = (Array.isArray(expectedAnswer) ? expectedAnswer : [expectedAnswer])
    .filter(Boolean)
    .map((a) => String(a).toLowerCase().replace(/[?!.,;:"'`~()\[\]{}]/g, '').replace(/\s+/g, ' ').trim());

  if (answers.includes(normalized)) {
    return { shouldIgnore: false, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 1, reason: 'exact_match', cleanedInput: normalized };
  }

  if (CASUAL_CHAT_BLACKLIST.has(normalized)) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'casual_blacklist', cleanedInput: normalized };
  }

  // Abaikan pola tawa berulang (wkwkwk, hahaha, hehehe, awokawok, xixixi)
  if (/^(wk|ha|he|hi|xi|awok|awk|kw)+[a-z]*$/i.test(normalized) && normalized.length >= 3) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'laugh_pattern', cleanedInput: normalized };
  }

  // Abaikan kalimat tanya atau kalimat diawali kata ekspresi ketidaktahuan
  if (trimmed.endsWith('?') || /^(apa|apakah|apaan|siapa|kapan|dimana|kenapa|mengapa|gimana|bagaimana|kok|lah|lho|loh|ga tau|gak tau|gk tau|gatau|enggak tau|ndak tau|entah|ntah|bukan|susah|bingung)\b/i.test(normalized)) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'question_or_expression', cleanedInput: normalized };
  }

  if (/@\d+|https?:\/\//i.test(trimmed)) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'mention_or_url', cleanedInput: normalized };
  }

  const expectsSingleChar = answers.some((a) => a.length === 1);
  if (normalized.length < 2 && !expectsSingleChar && !/^\d+$/.test(normalized)) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'too_short', cleanedInput: normalized };
  }

  const inputWords = normalized.split(' ').length;
  const maxExpectedWords = Math.max(1, ...answers.map((a) => a.split(' ').length));
  if (inputWords > Math.max(4, maxExpectedWords + 2)) {
    return { shouldIgnore: true, isHintRequest: false, isSurrenderRequest: false, isCloseAnswer: false, similarity: 0, reason: 'chat_sentence_too_long', cleanedInput: normalized };
  }

  let bestSimilarity = 0;
  for (const ans of answers) {
    const sim = computeStringSimilarity(normalized, ans);
    if (sim > bestSimilarity) bestSimilarity = sim;
  }

  return {
    shouldIgnore: false,
    isHintRequest: false,
    isSurrenderRequest: false,
    isCloseAnswer: bestSimilarity >= 0.72 && bestSimilarity < 1,
    similarity: bestSimilarity,
    reason: 'valid_attempt',
    cleanedInput: normalized
  };
}

function computeStringSimilarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  const matrix = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const distance = matrix[lenA][lenB];
  return 1 - distance / Math.max(lenA, lenB);
}

function buildProgressiveHint(answer, revealRatio = 0.35) {
  const str = String(answer || '').trim();
  if (!str) return '';
  const chars = str.split('');
  return chars
    .map((ch, idx) => {
      if (ch === ' ') return '   ';
      if (idx === 0) return ch.toUpperCase();
      if (revealRatio >= 0.5 && idx === chars.length - 1) return ch.toUpperCase();
      if (revealRatio >= 0.35 && idx % 3 === 0) return ch.toUpperCase();
      return '_';
    })
    .join(' ');
}

module.exports = {
  CASUAL_CHAT_BLACKLIST,
  HINT_KEYWORDS,
  SURRENDER_KEYWORDS,
  evaluateGameInput,
  computeStringSimilarity,
  buildProgressiveHint
};
