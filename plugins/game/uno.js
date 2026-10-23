const { handleUnoCommand } = require('../../lib/uno-handler');

module.exports = {
  name: 'uno',
  category: 'game',
  startsGame: true,
  aliases: ['unogame'],
  async execute(sock, msg, args, ctx) {
    return handleUnoCommand(sock, msg, args, ctx);
  },
};
