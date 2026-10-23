const { requireGroupAdmin, targetFromMessage, digits } = require('../../lib/group-utils');
const guard = require('../../lib/group-guard');

module.exports = {
  name: 'unwarn',
  category: 'group',
  aliases: ['delwarn', 'resetwarn'],
  async execute(sock, msg, args, ctx) {
    const { from, config, getGroupSettings, updateGroupSettings } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false })) return;
    const target = targetFromMessage(msg, ctx);
    if (!target) return sock.sendMessage(from, { text: `Format: *${config.prefix}unwarn @user*` }, { quoted: msg });
    const current = guard.getWarns(getGroupSettings, from, target);
    const next = Math.max(0, current - 1);
    guard.setWarns(getGroupSettings, updateGroupSettings, from, target, next);
    await sock.sendMessage(from, { text: `✅ Peringatan @${digits(target)} dikurangi: ${current} → ${next}`, mentions: [target] }, { quoted: msg });
  },
};
