const { DOA } = require('../../lib/islami-data');

function formatDoa(doa) {
  return `🤲 *${doa.judul}*\n\n${doa.arab}\n\n_${doa.latin}_\n\nArtinya: "${doa.arti}"`;
}

function findDoa(query) {
  const text = String(query || '').toLowerCase().replace(/^doa\s+/, '').trim();
  if (/^\d+$/.test(text)) return DOA[Number(text) - 1] || null;
  return DOA.find(doa => doa.key === text)
    || DOA.find(doa => doa.key.includes(text) || doa.judul.toLowerCase().includes(text))
    || null;
}

module.exports = {
  name: 'doa',
  category: 'islami',
  aliases: ['doaharian', 'listdoa'],
  findDoa,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const query = args.join(' ').trim();
    if (!query) {
      const list = DOA.map((doa, index) => `${index + 1}. ${doa.judul}`).join('\n');
      return sock.sendMessage(from, { text: `🤲 *DOA HARIAN*\n\n${list}\n\nKetik *${config.prefix}doa <nomor/nama>*, contoh: *${config.prefix}doa makan* atau *${config.prefix}doa acak*` }, { quoted: msg });
    }
    const doa = /^(acak|random)$/i.test(query) ? DOA[Math.floor(Math.random() * DOA.length)] : findDoa(query);
    if (!doa) return sock.sendMessage(from, { text: `❌ Doa *${query}* tidak ditemukan. Ketik *${config.prefix}doa* untuk melihat daftar.` }, { quoted: msg });
    await sock.sendMessage(from, { text: formatDoa(doa) }, { quoted: msg });
  },
};
