const { KISAH_NABI } = require('../../lib/islami-data');

module.exports = {
  name: 'kisahnabi',
  category: 'islami',
  aliases: ['nabi', 'kisahrasul'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const query = args.join(' ').toLowerCase().replace(/^nabi\s+/, '').trim();
    if (!query) {
      const list = KISAH_NABI.map(nabi => `${nabi.nomor}. Nabi ${nabi.nama}`).join('\n');
      return sock.sendMessage(from, { text: `📜 *25 NABI & RASUL*\n\n${list}\n\nKetik *${config.prefix}kisahnabi <nama/nomor>*, contoh: *${config.prefix}kisahnabi yusuf*` }, { quoted: msg });
    }
    const wanted = query.replace(/[^a-z0-9]/g, '');
    const nabi = /^\d+$/.test(wanted)
      ? KISAH_NABI[Number(wanted) - 1]
      : KISAH_NABI.find(item => item.nama.toLowerCase().replace(/[^a-z]/g, '') === wanted)
        || KISAH_NABI.find(item => item.nama.toLowerCase().replace(/[^a-z]/g, '').startsWith(wanted));
    if (!nabi) return sock.sendMessage(from, { text: `❌ Kisah nabi *${query}* tidak ditemukan.` }, { quoted: msg });
    await sock.sendMessage(from, { text: `📜 *KISAH NABI ${nabi.nama.toUpperCase()}* (nabi ke-${nabi.nomor})\n\n${nabi.kisah}` }, { quoted: msg });
  },
};
