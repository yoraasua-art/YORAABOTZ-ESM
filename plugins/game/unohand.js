const { handleUnoCommand } = require('../../lib/uno-handler');

// Kirim ulang kartu UNO
module.exports = {
  name: 'unohand',
  category: 'game',
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx, 'hand');
  },
};
