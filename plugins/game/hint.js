const { buildProgressiveHint } = require('../../lib/smart-answer-guard');
const gameEngine = require('../../lib/game-engine');

module.exports = {
  name: 'hint',
  command: ['hint', 'clue', 'bantu', 'petunjuk'],
  aliases: ['clue', 'bantu', 'petunjuk'],
  category: 'game',
  tags: ['game'],
  help: ['hint', 'clue'],
  description: 'Meminta petunjuk (clue) huruf tambahan untuk soal game yang sedang berlangsung',
  async execute(ctx) {
    const chatId = ctx.from || ctx.chatId || (ctx.m && ctx.m.key && ctx.m.key.remoteJid);
    const activeSession =
      (gameEngine && typeof gameEngine.getSession === 'function' && gameEngine.getSession(chatId)) ||
      (gameEngine && gameEngine.sessions && gameEngine.sessions.get && gameEngine.sessions.get(chatId));

    if (!activeSession || !(activeSession.answer || activeSession.jawaban)) {
      return ctx.reply('⚠️ Saat ini tidak ada sesi game/pertanyaan yang aktif di chat ini.');
    }

    activeSession.hintCount = (activeSession.hintCount || 0) + 1;
    const ratio = activeSession.hintCount === 1 ? 0.35 : activeSession.hintCount === 2 ? 0.5 : 0.65;
    const rawAns = activeSession.answer || activeSession.jawaban;
    const answerText = Array.isArray(rawAns) ? rawAns[0] : rawAns;
    const masked = buildProgressiveHint(answerText, ratio);

    return ctx.reply(
      `💡 *PETUNJUK SOAL (#${activeSession.hintCount})*\n\n` +
      `Clue: ` + '`' + masked + '`' + ` (${String(answerText).length} huruf)\n` +
      `_Ketik jawabanmu atau ketik *nyerah* untuk melewati soal ini._`
    );
  }
};
module.exports.handler = module.exports.execute;
