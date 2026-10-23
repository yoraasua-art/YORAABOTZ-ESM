const { handleUnoCommand } = require('../../lib/uno-handler');

// Keluar dari UNO
module.exports = {
  name: 'unoleave',
  category: 'game',
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx, 'leave');
  },
};
