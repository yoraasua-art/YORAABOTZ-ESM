const rpg = require('../../lib/rpg');

function withInterest(ctx) {
  const { sender, getUser, updateUser, config } = ctx;
  const user = getUser(sender);
  const result = rpg.applyInterest(user, config);
  if (result.interest > 0) updateUser(sender, { bank: result.bank, bankUpdatedAt: result.bankUpdatedAt });
  return { user: getUser(sender), interest: result.interest };
}

async function deposit(sock, msg, args, ctx) {
  const { from, sender, updateUser, formatMoney, config } = ctx;
  const opts = rpg.settings(config);
  const { user } = withInterest(ctx);
  const bank = Number(user.bank) || 0;
  const amount = rpg.parseAmount(args[0], Math.min(user.money || 0, opts.bankMax - bank));
  if (!Number.isInteger(amount) || amount < 1) return sock.sendMessage(from, { text: `Format: *${config.prefix}tabung <jumlah|all>* (contoh: ${config.prefix}tabung 10k)` }, { quoted: msg });
  if (amount > (user.money || 0)) return sock.sendMessage(from, { text: `❌ Uang di dompet tidak cukup. Saldo: ${formatMoney(user.money || 0)}` }, { quoted: msg });
  if (bank + amount > opts.bankMax) return sock.sendMessage(from, { text: `❌ Batas maksimal tabungan ${formatMoney(opts.bankMax)}.` }, { quoted: msg });
  updateUser(sender, { money: user.money - amount, bank: bank + amount, bankUpdatedAt: user.bankUpdatedAt && bank > 0 ? user.bankUpdatedAt : Date.now() });
  return sock.sendMessage(from, { text: `🏦 Berhasil menabung *${formatMoney(amount)}*\n\n💰 Dompet: ${formatMoney(user.money - amount)}\n🏦 Bank: ${formatMoney(bank + amount)}\n\nUang di bank aman dari *rampok* dan mendapat bunga ${opts.bankInterest * 100}%/hari.` }, { quoted: msg });
}

async function withdraw(sock, msg, args, ctx) {
  const { from, sender, updateUser, formatMoney, config } = ctx;
  const { user } = withInterest(ctx);
  const bank = Number(user.bank) || 0;
  const amount = rpg.parseAmount(args[0], bank);
  if (!Number.isInteger(amount) || amount < 1) return sock.sendMessage(from, { text: `Format: *${config.prefix}tarik <jumlah|all>*` }, { quoted: msg });
  if (amount > bank) return sock.sendMessage(from, { text: `❌ Saldo bank tidak cukup. Bank: ${formatMoney(bank)}` }, { quoted: msg });
  updateUser(sender, { money: (user.money || 0) + amount, bank: bank - amount });
  return sock.sendMessage(from, { text: `🏦 Berhasil menarik *${formatMoney(amount)}*\n\n💰 Dompet: ${formatMoney((user.money || 0) + amount)}\n🏦 Bank: ${formatMoney(bank - amount)}` }, { quoted: msg });
}

module.exports = {
  name: 'bank',
  category: 'ekonomi',
  aliases: ['atm', 'saldobank'],
  deposit,
  withdraw,
  async execute(sock, msg, args, ctx) {
    const action = (args[0] || '').toLowerCase();
    if (['tabung', 'nabung', 'deposit', 'setor'].includes(action)) return deposit(sock, msg, args.slice(1), ctx);
    if (['tarik', 'ambil', 'withdraw'].includes(action)) return withdraw(sock, msg, args.slice(1), ctx);
    const { from, formatMoney, config } = ctx;
    const opts = rpg.settings(config);
    const { user, interest } = withInterest(ctx);
    await sock.sendMessage(from, {
      text: `🏦 *BANK ${config.botName.toUpperCase()}*\n\n💰 Dompet: ${formatMoney(user.money || 0)}\n🏦 Tabungan: ${formatMoney(user.bank || 0)}\n` +
        `${interest ? `✨ Bunga masuk: +${formatMoney(interest)}\n` : ''}📈 Bunga: ${opts.bankInterest * 100}%/hari (maks ${formatMoney(opts.bankMaxInterestPerDay)}/hari)\n\n` +
        `• *${config.prefix}tabung <jumlah|all>*\n• *${config.prefix}tarik <jumlah|all>*`,
    }, { quoted: msg });
  },
};
