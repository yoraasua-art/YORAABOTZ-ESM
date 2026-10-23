module.exports = {
  name: 'listwarn',
  category: 'group',
  aliases: ['warnlist', 'cekwarn'],
  async execute(sock, msg, args, ctx) {
    const { from, config, isGroup, getGroupSettings } = ctx;
    if (!isGroup(from)) return sock.sendMessage(from, { text: '❌ Command ini hanya bisa digunakan di grup.' }, { quoted: msg });
    const limit = require('../../lib/group-guard').warnLimit(config);
    const entries = Object.entries(getGroupSettings(from).warns || {}).filter(([, count]) => count > 0);
    if (!entries.length) return sock.sendMessage(from, { text: '✅ Tidak ada anggota yang memiliki peringatan.' }, { quoted: msg });
    const mentions = entries.map(([number]) => `${number}@s.whatsapp.net`);
    const lines = entries.map(([number, count], index) => `${index + 1}. @${number} — ${count}/${limit}`);
    await sock.sendMessage(from, { text: `⚠️ *DAFTAR PERINGATAN*\n\n${lines.join('\n')}`, mentions }, { quoted: msg });
  },
};
