const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'jawabquiz', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'jawabquiz',
      games: ['quiz'],
      noGameText: '❌ Tidak ada quiz aktif.',
    });
  },
};
