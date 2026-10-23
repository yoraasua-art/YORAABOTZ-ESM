const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'admincheck',
  category: 'group',
  aliases: ['cekadmin', 'botadmin', 'cekbotadmin'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const sender = roles.senderIsAdmin ? '✅ Kamu admin grup.' : '❌ Kamu bukan admin grup.';
    const bot = roles.botIsAdmin ? '✅ Bot adalah admin grup.' : '❌ Bot bukan admin grup.';
    await sock.sendMessage(from, { text: `🛡️ *ADMIN CHECK*\n\n${sender}\n${bot}\n\n${roles.meta.subject}` }, { quoted: msg });
  },
};
