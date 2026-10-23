const rpg = require('../../lib/rpg');

module.exports = {
  name: 'kerja',
  category: 'ekonomi',
  aliases: ['work', 'bekerja'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, getUser, updateUser, config, formatMoney } = ctx;
    const opts = rpg.settings(config);
    const user = getUser(sender);
    const wait = rpg.cooldownLeft(user, 'kerja', opts.kerjaCooldown);
    if (wait > 0) return sock.sendMessage(from, { text: `⏳ Kamu baru saja bekerja. Istirahat dulu *${rpg.formatWait(wait)}* lagi.` }, { quoted: msg });
    const [job, activity] = rpg.JOBS[Math.floor(Math.random() * rpg.JOBS.length)];
    const salary = rpg.randomInt(opts.kerjaMin, opts.kerjaMax);
    const data = rpg.ensureRpg(user);
    data.cooldowns.kerja = Date.now();
    updateUser(sender, { money: (user.money || 0) + salary, cooldowns: data.cooldowns, exp: (user.exp || 0) + 10 });
    await sock.sendMessage(from, {
      text: `💼 *KERJA*\n\nKamu bekerja sebagai *${job}* dan ${activity}.\n\n💵 Gaji: +${formatMoney(salary)}\n💰 Saldo: ${formatMoney((user.money || 0) + salary)}\n\nBisa kerja lagi dalam ${rpg.formatWait(opts.kerjaCooldown)}.`,
    }, { quoted: msg });
  },
};
