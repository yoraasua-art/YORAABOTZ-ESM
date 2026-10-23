const { requireGroupAdmin, participantIds, digits } = require('../../lib/group-utils');
const guard = require('../../lib/group-guard');

const DAY = 24 * 60 * 60 * 1000;

function findInactive(participants, groupActivity, days, now = Date.now()) {
  const members = groupActivity?.members || {};
  const cutoff = now - days * DAY;
  return participants
    .filter(participant => !participant.admin)
    .map(participant => {
      const lastSeen = Math.max(0, ...participantIds(participant).map(id => members[id] || 0));
      return { participant, lastSeen };
    })
    .filter(entry => entry.lastSeen < cutoff)
    .sort((a, b) => a.lastSeen - b.lastSeen);
}

module.exports = {
  name: 'sider',
  category: 'group',
  aliases: ['ceksider', 'inactive', 'gcsider'],
  findInactive,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const days = Math.min(Math.max(parseInt(args[0], 10) || 7, 1), 90);
    const activity = guard.getGroupActivity(from);
    const inactive = findInactive(roles.participants, activity, days).filter(entry => !roles.isBot(entry.participant.id));
    const trackedDays = activity ? Math.floor((Date.now() - activity.since) / DAY) : 0;
    const note = `_Aktivitas dicatat sejak bot aktif di grup ini (${trackedDays} hari). Gunakan ${config.prefix}sider <hari> untuk mengubah batas._`;
    if (!inactive.length) {
      return sock.sendMessage(from, { text: `✅ Tidak ada anggota yang pasif lebih dari ${days} hari.\n\n${note}` }, { quoted: msg });
    }
    const shown = inactive.slice(0, 50);
    const lines = shown.map((entry, index) => {
      const when = entry.lastSeen ? `${Math.floor((Date.now() - entry.lastSeen) / DAY)} hari lalu` : 'belum pernah chat';
      return `${index + 1}. @${digits(entry.participant.id)} — ${when}`;
    });
    await sock.sendMessage(from, {
      text: `👻 *DAFTAR SIDER* (pasif > ${days} hari)\n\n${lines.join('\n')}${inactive.length > shown.length ? `\n...dan ${inactive.length - shown.length} lainnya` : ''}\n\nTotal: ${inactive.length} anggota\n\n${note}`,
      mentions: shown.map(entry => entry.participant.id),
    }, { quoted: msg });
  },
};
