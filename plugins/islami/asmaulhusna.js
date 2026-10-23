const { ASMAUL_HUSNA } = require('../../lib/islami-data');

module.exports = {
  name: 'asmaulhusna',
  category: 'islami',
  aliases: ['asmaul', 'asmaulhusnah'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const query = (args[0] || '').toLowerCase();
    if (query === 'all' || query === 'semua') {
      const text = ASMAUL_HUSNA.map(item => `${item.nomor}. ${item.latin} — ${item.arti}`).join('\n');
      return sock.sendMessage(from, { text: `✨ *99 ASMAUL HUSNA*\n\n${text}` }, { quoted: msg });
    }
    let item;
    if (/^\d+$/.test(query)) {
      item = ASMAUL_HUSNA[Number(query) - 1];
      if (!item) return sock.sendMessage(from, { text: '❌ Nomor Asmaul Husna hanya 1–99.' }, { quoted: msg });
    } else if (query) {
      const wanted = query.replace(/[^a-z]/g, '');
      item = ASMAUL_HUSNA.find(entry => entry.latin.toLowerCase().replace(/[^a-z]/g, '').includes(wanted));
      if (!item) return sock.sendMessage(from, { text: `❌ Nama *${query}* tidak ditemukan.` }, { quoted: msg });
    } else {
      item = ASMAUL_HUSNA[Math.floor(Math.random() * ASMAUL_HUSNA.length)];
    }
    await sock.sendMessage(from, {
      text: `✨ *ASMAUL HUSNA ke-${item.nomor}*\n\n*${item.latin}*\n${item.arti}\n\nKetik *${config.prefix}asmaulhusna <1-99>* atau *${config.prefix}asmaulhusna all*`,
    }, { quoted: msg });
  },
};
