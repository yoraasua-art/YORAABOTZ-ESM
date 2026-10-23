const { requireGroupAdmin, targetFromMessage } = require('../../lib/group-utils');
const guard = require('../../lib/group-guard');

module.exports = {
  name: 'warn',
  category: 'group',
  aliases: ['peringatan'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const target = targetFromMessage(msg, ctx);
    if (!target) {
      return sock.sendMessage(from, { text: `Format: *${config.prefix}warn @user <alasan>* (atau balas pesannya). ${guard.warnLimit(config)} peringatan = kick otomatis.` }, { quoted: msg });
    }
    const participant = roles.find(target);
    if (!participant) return sock.sendMessage(from, { text: '❌ User tersebut bukan anggota grup ini.' }, { quoted: msg });
    if (participant.admin) return sock.sendMessage(from, { text: '❌ Admin grup tidak dapat diberi peringatan.' }, { quoted: msg });
    if (roles.isBot(participant.id)) return sock.sendMessage(from, { text: '❌ Bot tidak bisa memperingatkan dirinya sendiri.' }, { quoted: msg });
    const reason = args.filter(word => !word.startsWith('@')).join(' ').trim();
    try {
      await guard.applyWarn(sock, ctx, roles, participant.id, reason);
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal memproses peringatan: ${error.message}` }, { quoted: msg });
    }
  },
};
