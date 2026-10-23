const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'jawabemoji', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'jawabemoji',
      games: ['tebakemoji'],
      noGameText: '❌ Tidak ada game tebak emoji yang aktif.',
    });
  },
};
