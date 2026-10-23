const { handleUnoCommand } = require('../../lib/uno-handler');

// Gabung ke lobi UNO
module.exports = {
  name: 'unojoin',
  category: 'game',
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx, 'join');
  },
};
