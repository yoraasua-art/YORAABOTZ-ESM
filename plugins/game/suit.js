const pvp = require('../../lib/pvp');

module.exports = {
  name: 'suit', category: 'game', aliases: ['rps', 'suitpvp'],
  async execute(sock, msg, args, ctx) {
    const { config, from, sender, user, updateUser, random, formatMoney } = ctx;
    if (ctx.mentioned?.length) return pvp.createChallenge('suit', sock, msg, args, ctx);
    if (['terima', 'tolak', 'batal'].includes(args[0]?.toLowerCase())) {
      const handled = await pvp.respond(sock, msg, ctx, args[0].toLowerCase() === 'terima');
      if (!handled) await sock.sendMessage(from, { text: '❌ Tidak ada tantangan suit untukmu.' }, { quoted: msg });
      return;
    }
    const pilihan = args[0]?.toLowerCase();
    const bet = parseInt(args[1]);
    const map = { batu: '✊', gunting: '✌️', kertas: '✋' };
    if (!['batu','gunting','kertas'].includes(pilihan)) return sock.sendMessage(from, { text: `❌ Pilih: batu/gunting/kertas\nContoh: *${config.prefix}suit batu 500*\nPvP: *${config.prefix}suit @user [taruhan]*` }, { quoted: msg });
    if (!bet || bet < config.minBet || bet > config.maxBet) return sock.sendMessage(from, { text: '❌ Taruhan tidak valid!' }, { quoted: msg });
    if (user.money < bet) return sock.sendMessage(from, { text: '❌ Uang tidak cukup!' }, { quoted: msg });
    const botP = random(['batu','gunting','kertas']);
    let win = 0, hasil = '';
    if (pilihan === botP) { win = 0; hasil = '🤝 Seri!'; }
    else if ((pilihan === 'batu' && botP === 'gunting') || (pilihan === 'gunting' && botP === 'kertas') || (pilihan === 'kertas' && botP === 'batu')) { win = bet; hasil = '🎉 Menang!'; }
    else { win = -bet; hasil = '😢 Kalah!'; }
    updateUser(sender, { money: user.money + win });
    await sock.sendMessage(from, { text: `✊ *SUIT*\n\nKamu: ${map[pilihan]} ${pilihan}\nBot: ${map[botP]} ${botP}\n\n${hasil}\n${win !== 0 ? (win > 0 ? '+' : '') + formatMoney(win) : ''}\nSaldo: ${formatMoney(user.money + win)}` }, { quoted: msg });
  }
};