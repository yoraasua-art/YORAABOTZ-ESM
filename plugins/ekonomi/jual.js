const rpg = require('../../lib/rpg');

module.exports = {
  name: 'jual',
  category: 'ekonomi',
  aliases: ['sell'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, getUser, updateUser, formatMoney, config } = ctx;
    const user = getUser(sender);
    const data = rpg.ensureRpg(user);
    const target = (args[0] || '').toLowerCase();
    if (!target) {
      const prices = Object.entries(rpg.ITEMS).map(([key, item]) => `${item.emoji} ${key} — ${formatMoney(item.price)}`).join('\n');
      return sock.sendMessage(from, { text: `💰 *JUAL BARANG*\n\nFormat: *${config.prefix}jual <item> <jumlah|all>* atau *${config.prefix}jual semua*\n\n📋 Harga:\n${prices}` }, { quoted: msg });
    }
    let sold = [];
    if (['semua', 'all'].includes(target)) {
      sold = Object.entries(data.inventory).filter(([key, amount]) => amount > 0 && rpg.ITEMS[key]);
    } else {
      const key = rpg.findItem(target);
      if (!key) return sock.sendMessage(from, { text: `❌ Item *${target}* tidak dikenal. Ketik *${config.prefix}jual* untuk daftar item.` }, { quoted: msg });
      const owned = data.inventory[key] || 0;
      const amount = rpg.parseAmount(args[1] || '1', owned);
      if (!Number.isInteger(amount) || amount < 1) return sock.sendMessage(from, { text: '❌ Jumlah tidak valid.' }, { quoted: msg });
      if (amount > owned) return sock.sendMessage(from, { text: `❌ Kamu hanya punya ${owned} ${rpg.ITEMS[key].name}.` }, { quoted: msg });
      sold = [[key, amount]];
    }
    if (!sold.length) return sock.sendMessage(from, { text: '🎒 Tidak ada barang untuk dijual.' }, { quoted: msg });
    let total = 0;
    const lines = sold.map(([key, amount]) => {
      const value = rpg.ITEMS[key].price * amount;
      total += value;
      data.inventory[key] -= amount;
      if (data.inventory[key] <= 0) delete data.inventory[key];
      return `${rpg.ITEMS[key].emoji} ${amount}× ${rpg.ITEMS[key].name} = ${formatMoney(value)}`;
    });
    updateUser(sender, { inventory: data.inventory, money: (user.money || 0) + total });
    await sock.sendMessage(from, { text: `💰 *TERJUAL*\n\n${lines.join('\n')}\n\nTotal: *+${formatMoney(total)}*\nSaldo: ${formatMoney((user.money || 0) + total)}` }, { quoted: msg });
  },
};
