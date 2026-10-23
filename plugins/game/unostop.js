const { handleUnoCommand } = require('../../lib/uno-handler');

// Hentikan permainan UNO
module.exports = {
  name: 'unostop',
  category: 'game',
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx, 'stop');
  },
};
