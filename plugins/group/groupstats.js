const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'groupstats',
  category: 'group',
  aliases: ['statgroup', 'statgc', 'gcstats'],
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const roles = await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false });
    if (!roles) return;
    const admins = roles.participants.filter(p => p.admin).length;
    const owners = roles.participants.filter(p => p.admin === 'superadmin').length;
    const members = roles.participants.length - admins;
    await sock.sendMessage(from, { text: `📊 *STATISTIK GRUP*\n\n📛 Nama: ${roles.meta.subject}\n👥 Total anggota: ${roles.participants.length}\n👤 Member: ${members}\n🛡️ Admin: ${admins}\n👑 Superadmin: ${owners}\n📝 Deskripsi: ${roles.meta.desc ? 'Ada' : 'Tidak ada'}` }, { quoted: msg });
  },
};
