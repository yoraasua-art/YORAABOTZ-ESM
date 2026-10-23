const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'jawab', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'jawab',
      games: ['tebakangka'],
      noGameText: '❌ Tidak ada game tebak angka yang aktif.',
    });
  },
};
