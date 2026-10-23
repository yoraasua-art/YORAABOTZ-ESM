const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menugame',
  category: 'menu',
  aliases: ['menugames'],
  async execute(sock, msg, args, ctx) {
    const { config, from, formatMoney, pluginList } = ctx;
    const menuText = renderMenu({
      botName: config.botName,
      title: 'PERMAINAN',
      prefix: config.prefix,
      pluginList,
      includeCategories: ['game'],
      sections: [
        {
          icon: '🎰',
          title: 'PERMAINAN TARUHAN',
          items: [
            `${config.prefix}slot <taruhan>`,
            `${config.prefix}dadu <taruhan>`,
            `${config.prefix}koin <taruhan>`,
            `${config.prefix}bj <taruhan>`,
            `${config.prefix}roulette <warna> <taruhan>`,
            `${config.prefix}sicbo <taruhan> <besar/kecil>`,
            `${config.prefix}suit <pilihan> <taruhan>`,
            `${config.prefix}war <taruhan>`,
            `${config.prefix}wheel <taruhan>`,
          ],
        },
        {
          icon: '🎯',
          title: 'TEBAK-TEBAKAN',
          items: [
            `${config.prefix}tebakangka [sulit] — 1-10 / 1-100 dengan petunjuk`,
            `${config.prefix}susunkata`,
            `${config.prefix}tekateki`,
            `${config.prefix}tebaklirik`,
            `${config.prefix}tebakkalimat`,
            `${config.prefix}quiz`,
            `${config.prefix}tebakkata`,
            `${config.prefix}tebakemoji`,
            `${config.prefix}math [mudah/sedang/sulit/biasa] — soal cerita`,
            `${config.prefix}hangman`,
            `${config.prefix}tebakgambar`,
            `${config.prefix}tebakpemainbola`,
            `${config.prefix}tebaklagu`,
            `${config.prefix}tebakfilm`,
            `${config.prefix}tebakhewan`,
            `${config.prefix}tebakibukota`,
            `${config.prefix}tebakbendera`,
            `${config.prefix}tebakpresiden`,
            `${config.prefix}tebakplanet`,
            `${config.prefix}tebakanime`,
          ],
        },
        {
          icon: '🧠',
          title: 'ASAH OTAK & TEKA-TEKI',
          items: [
            `${config.prefix}asahotak`,
            `${config.prefix}siapakahaku`,
            `${config.prefix}caklontong`,
            `${config.prefix}lengkapikalimat`,
            `${config.prefix}family100`,
          ],
        },
        {
          icon: '🃏',
          title: 'UNO (2–10 PEMAIN)',
          items: [
            `${config.prefix}uno — buat lobi`,
            `${config.prefix}unojoin — gabung`,
            `${config.prefix}unostart — mulai (host)`,
            `${config.prefix}unohand — kirim ulang kartu`,
            `${config.prefix}unoleave · ${config.prefix}unostop`,
            `${config.prefix}uno help — cara main lengkap`,
          ],
        },
        { icon: '🎮', title: 'PERMAINAN PAPAN', items: [`${config.prefix}ttt @user — tantang pemain lain; terima, lalu kirim angka 1–9 tanpa prefix`] },
        { icon: '⚔️', title: 'PvP', items: [`${config.prefix}suit @user [taruhan] — pilih rahasia lewat chat pribadi bot`, `${config.prefix}duel @user [taruhan] — adu HP otomatis`, 'Lawan ketik *terima* atau *tolak*.'] },
        { icon: '🏆', title: 'STATISTIK & PERINGKAT', items: [`${config.prefix}statgame [@user] — menang, streak, game favorit`, `${config.prefix}topgame — leaderboard mingguan (hadiah otomatis tiap Senin)`] },
        {
          icon: '💡',
          title: 'CARA BERMAIN',
          items: [
            '*Rebutan!* Siapa pun di chat boleh menjawab — yang benar paling cepat menang.',
            'Kirim jawaban langsung di chat.',
            'Jawaban salah dibalas bot, dan petunjuk muncul setelah beberapa kali salah.',
            'Ketik *nyerah* untuk melewati soal (hanya yang memulai soal).',
            `Waktu menjawab setiap permainan: *${ctx.gameDurationText || '2 menit'}*.`,
            'Semua permainan gratis dan tidak memakai limit.',
            `Taruhan minimum: *${formatMoney(config.minBet)}* · maksimum: *${formatMoney(config.maxBet)}*`,
          ],
        },
      ],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};
