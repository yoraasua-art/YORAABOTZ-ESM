module.exports = {
  name: 'version',
  category: 'info',
  aliases: ['versi', 'botversion'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const text = `📦 *INFO RUNTIME*

  ◆  Node.js   : *${process.version}*
  ◆  Platform  : *${process.platform}*`;

    await sock.sendMessage(from, { text });
  },
};
