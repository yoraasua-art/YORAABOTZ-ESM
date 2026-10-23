const { handleUnoCommand } = require('../../lib/uno-handler');

// Mulai permainan UNO
module.exports = {
  name: 'unostart',
  category: 'game',
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx, 'start');
  },
};
