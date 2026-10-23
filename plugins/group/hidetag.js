const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'hidetag',
  category: 'group',
  aliases: ['ht', 'h'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || quoted?.imageMessage?.caption || quoted?.videoMessage?.caption || '';
    const text = args.join(' ').trim() || quotedText;
    if (!text) {
      return sock.sendMessage(from, { text: `Format: *${config.prefix}hidetag <pesan>* atau balas pesan dengan *${config.prefix}hidetag*` }, { quoted: msg });
    }
    const mentions = roles.participants.map(participant => participant.id);
    await sock.sendMessage(from, { text, mentions });
  },
};
