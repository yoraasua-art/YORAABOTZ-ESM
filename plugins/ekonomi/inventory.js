const rpg = require('../../lib/rpg');

module.exports = {
  name: 'inventory',
  category: 'ekonomi',
  aliases: ['inv', 'tas', 'inventori'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, getUser, formatMoney, config } = ctx;
    const user = getUser(sender);
    const { inventory, bank, cooldowns } = rpg.ensureRpg(user);
    const items = Object.entries(inventory).filter(([key, amount]) => amount > 0 && rpg.ITEMS[key]);
    const lines = items.map(([key, amount]) => `${rpg.ITEMS[key].emoji} ${rpg.ITEMS[key].name} (${key}): *${amount}* · ${formatMoney(rpg.ITEMS[key].price * amount)}`);
    const opts = rpg.settings(config);
    const timers = [
      ['kerja', opts.kerjaCooldown], ['mancing', rpg.ACTIVITIES.mancing.cooldown], ['berburu', rpg.ACTIVITIES.berburu.cooldown],
      ['nambang', rpg.ACTIVITIES.nambang.cooldown], ['rampok', opts.rampokCooldown],
    ].map(([key, duration]) => {
      const wait = rpg.cooldownLeft({ cooldowns }, key, duration);
      return `${key}: ${wait ? `⏳ ${rpg.formatWait(wait)}` : '✅ siap'}`;
    });
    await sock.sendMessage(from, {
      text: `🎒 *INVENTORY*\n\n${lines.length ? lines.join('\n') : 'Masih kosong. Coba .mancing, .berburu, atau .nambang!'}\n\n` +
        `📦 Nilai barang: ${formatMoney(rpg.inventoryValue(inventory))}\n💰 Dompet: ${formatMoney(user.money || 0)}\n🏦 Bank: ${formatMoney(bank)}\n\n⏱️ *Cooldown*\n${timers.join('\n')}`,
    }, { quoted: msg });
  },
};
