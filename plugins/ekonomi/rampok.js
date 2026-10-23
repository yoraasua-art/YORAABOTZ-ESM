const rpg = require('../../lib/rpg');
const { digits } = require('../../lib/group-utils');

module.exports = {
  name: 'rampok',
  category: 'ekonomi',
  aliases: ['rob', 'maling'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, getUser, updateUser, formatMoney, config, isGroup } = ctx;
    const opts = rpg.settings(config);
    if (!isGroup(from)) return sock.sendMessage(from, { text: '❌ Rampok hanya bisa dilakukan di grup.' }, { quoted: msg });
    const target = ctx.mentioned?.[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) return sock.sendMessage(from, { text: `Format: *${config.prefix}rampok @user*\nUang di bank aman dari rampok.` }, { quoted: msg });
    if (digits(target) === digits(sender)) return sock.sendMessage(from, { text: '❌ Tidak bisa merampok diri sendiri.' }, { quoted: msg });
    const user = getUser(sender);
    const wait = rpg.cooldownLeft(user, 'rampok', opts.rampokCooldown);
    if (wait > 0) return sock.sendMessage(from, { text: `🚓 Polisi masih mencarimu! Tunggu *${rpg.formatWait(wait)}*.` }, { quoted: msg });
    const victim = getUser(target);
    if ((victim.money || 0) < opts.rampokMinTarget) {
      return sock.sendMessage(from, { text: `😅 Dompet @${digits(target)} terlalu tipis (< ${formatMoney(opts.rampokMinTarget)}). Cari target lain.`, mentions: [target] }, { quoted: msg });
    }
    const data = rpg.ensureRpg(user);
    data.cooldowns.rampok = Date.now();
    if (Math.random() < opts.rampokChance) {
      const stolen = Math.min(Math.floor(victim.money * (rpg.randomInt(10, 30) / 100)), opts.rampokMaxSteal);
      updateUser(target, { money: victim.money - stolen });
      updateUser(sender, { money: (user.money || 0) + stolen, cooldowns: data.cooldowns });
      return sock.sendMessage(from, {
        text: `🦹 *RAMPOK BERHASIL!*\n\n@${digits(sender)} merampok @${digits(target)} dan membawa kabur *${formatMoney(stolen)}*!\n\n💡 Simpan uang di *${config.prefix}tabung* agar aman.`,
        mentions: [sender, target],
      }, { quoted: msg });
    }
    const fine = Math.min(user.money || 0, Math.max(500, Math.floor((user.money || 0) * 0.1)));
    updateUser(sender, { money: (user.money || 0) - fine, cooldowns: data.cooldowns });
    updateUser(target, { money: victim.money + fine });
    await sock.sendMessage(from, {
      text: `🚓 *RAMPOK GAGAL!*\n\n@${digits(sender)} tertangkap saat mencoba merampok @${digits(target)}.\nDenda *${formatMoney(fine)}* dibayarkan kepada korban.`,
      mentions: [sender, target],
    }, { quoted: msg });
  },
};
