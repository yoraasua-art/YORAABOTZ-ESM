const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'jawabkata', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'jawabkata',
      games: ['tebakkata'],
      noGameText: '❌ Tidak ada game tebak kata yang aktif.',
    });
  },
};
