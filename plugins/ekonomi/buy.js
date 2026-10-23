const { getShopItems } = require('../../lib/shop');

function normalizeItem(input) {
  return String(input || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

module.exports = {
  name: 'buy',
  category: 'ekonomi',
  aliases: ['beli', 'purchase'],
  description: 'Membeli item dari toko menggunakan uang.',
  async execute(sock, msg, args, ctx) {
    const { config, from, sender, user, updateUser, formatMoney, isPremium } = ctx;
    const requested = normalizeItem(args.join(' '));
    if (!requested) {
      return sock.sendMessage(from, {
        text: `🛒 *Format:* ${config.prefix}buy <item>\n\nLihat daftar item dengan ${config.prefix}shop.`,
      }, { quoted: msg });
    }

    const items = getShopItems(config, Boolean(isPremium && isPremium()));
    const item = items.find(entry => {
      const key = normalizeItem(entry.key);
      const name = normalizeItem(entry.name);
      return requested === key || requested === name || key.includes(requested) || name.includes(requested);
    });
    if (!item) {
      return sock.sendMessage(from, {
        text: `❌ Item *${requested}* tidak ditemukan.\n\nKetik ${config.prefix}shop untuk melihat item yang tersedia.`,
      }, { quoted: msg });
    }

    const price = Number(item.finalPrice) || 0;
    const balance = Number(user.money) || 0;
    if (balance < price) {
      return sock.sendMessage(from, {
        text: `💸 *Saldo tidak cukup.*\n\nItem: *${item.name}*\nHarga: *${formatMoney(price)}*\nSaldo: *${formatMoney(balance)}*\nKurang: *${formatMoney(price - balance)}*`,
      }, { quoted: msg });
    }

    const updates = { money: balance - price };
    const effect = item.effect || {};
    if (effect.limit) updates.limit = (Number(user.limit) || 0) + Number(effect.limit);
    if (effect.point) updates.point = (Number(user.point) || 0) + Number(effect.point);
    if (effect.money) updates.money += Number(effect.money);
    if (effect.premiumDays) {
      if (!ctx.addPremium) return sock.sendMessage(from, { text: '❌ Item Premium belum dapat diproses pada konfigurasi ini.' }, { quoted: msg });
      ctx.addPremium(sender, Number(effect.premiumDays));
    }

    updateUser(sender, updates);
    const discountLine = item.discountPercent ? `\n💎 Diskon premium: ${item.discountPercent}%` : '';
    const extraParts = [];
    if (effect.limit) extraParts.push(`\n🎫 Limit: *+${effect.limit}*`);
    if (effect.point) extraParts.push(`\n⭐ Poin: *+${effect.point}*`);
    if (effect.money) extraParts.push(`\n💵 Bonus uang: *+${formatMoney(effect.money)}*`);
    const extra = extraParts.join('');
    return sock.sendMessage(from, {
      text: `╭━━━〔 🛍️ *PEMBELIAN BERHASIL* 〕━━━╮\n│ Item: *${item.name}*\n│ Harga: ${formatMoney(price)}${discountLine}${extra}\n│ Saldo tersisa: ${formatMoney(updates.money)}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n✨ Terima kasih sudah berbelanja di *${config.botName || 'Yora Botz'}*.`,
    }, { quoted: msg });
  },
};
