const groupAbsenSessions = new Map();

module.exports = {
  name: 'absengc',
  command: ['absengc', 'hadir', 'cekabsen', 'mulaiabsen', 'hapusabsen'],
  aliases: ['hadir', 'cekabsen', 'mulaiabsen', 'hapusabsen'],
  category: 'group',
  tags: ['group'],
  help: ['absengc', 'hadir', 'cekabsen'],
  description: 'Sistem absensi kehadiran anggota grup lengkap (.mulaiabsen, .hadir, .cekabsen)',
  async execute(ctx) {
    const chatId = ctx.from || ctx.chatId || 'default-group';
    const cmd = (ctx.command || 'absengc').toLowerCase();
    const sender = ctx.sender || ctx.pushName || 'Member';
    const name = ctx.pushName || sender.split('@')[0];

    if (cmd === 'hapusabsen') {
      groupAbsenSessions.delete(chatId);
      return ctx.reply('🗑️ Daftar absensi grup telah ditutup dan direset.');
    }

    if (cmd === 'mulaiabsen' || !groupAbsenSessions.has(chatId)) {
      const judul = (ctx.args && ctx.args.join(' ')) || 'Absensi Kehadiran Grup Hari Ini';
      if (!groupAbsenSessions.has(chatId) || cmd === 'mulaiabsen') {
        groupAbsenSessions.set(chatId, {
          title: judul,
          createdAt: new Date().toLocaleString('id-ID'),
          list: []
        });
      }
      if (cmd === 'mulaiabsen') {
        return ctx.reply(
          `📋 *ABSENSI GRUP DIMULAI!*\n\n` +
          `📌 Topik: *${judul}*\n` +
          `Ketik *.hadir* untuk mengisi daftar hadir atau *.cekabsen* untuk melihat rekap.`
        );
      }
    }

    const session = groupAbsenSessions.get(chatId);
    if (cmd === 'hadir' || cmd === 'absengc') {
      const exists = session.list.find((x) => x.sender === sender);
      if (!exists) {
        session.list.push({ sender, name, time: new Date().toLocaleTimeString('id-ID') });
      }
    }

    const rows = session.list
      .map((item, idx) => `${idx + 1}. *${item.name}* (${item.time})`)
      .join('\n') || '_Belum ada yang absen_';

    return ctx.reply(
      `📋 *DAFTAR HADIR GRUP*\n` +
      `📌 *${session.title}*\n` +
      `🕒 Dibuat: ${session.createdAt}\n\n` +
      `${rows}\n\n` +
      `Total Hadir: *${session.list.length} Orang*\n` +
      `_Ketik *.hadir* untuk ikut absen atau *.hapusabsen* untuk selesai._`
    );
  }
};
module.exports.handler = module.exports.execute;
