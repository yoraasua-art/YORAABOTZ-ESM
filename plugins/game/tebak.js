const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'tebak', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'tebak',
      games: ['hangman'],
      noGameText: '❌ Tidak ada game hangman yang aktif.',
    });
  },
};
