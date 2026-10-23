const { HADIS } = require('../../lib/islami-data');

module.exports = {
  name: 'hadis',
  category: 'islami',
  aliases: ['hadits', 'hadist'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const number = Number(args[0]);
    let hadis;
    if (args[0]) {
      hadis = HADIS[number - 1];
      if (!Number.isInteger(number) || !hadis) {
        return sock.sendMessage(from, { text: `❌ Nomor hadis hanya 1–${HADIS.length}.` }, { quoted: msg });
      }
    } else {
      hadis = HADIS[Math.floor(Math.random() * HADIS.length)];
    }
    await sock.sendMessage(from, {
      text: `📚 *HADIS #${hadis.nomor}*\n\nRasulullah ﷺ bersabda:\n"${hadis.teks}"\n\n_(${hadis.riwayat})_\n\nKetik *${config.prefix}hadis* untuk hadis acak atau *${config.prefix}hadis <1-${HADIS.length}>*`,
    }, { quoted: msg });
  },
};
