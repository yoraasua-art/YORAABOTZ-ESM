const { answerFromCommand } = require('../../lib/game-engine');

module.exports = {
  name: 'jawabmath', category: 'game',
  async execute(sock, msg, args, ctx) {
    return answerFromCommand(sock, msg, args, ctx, {
      command: 'jawabmath',
      games: ['math'],
      noGameText: '❌ Tidak ada soal math yang aktif.',
    });
  },
};
