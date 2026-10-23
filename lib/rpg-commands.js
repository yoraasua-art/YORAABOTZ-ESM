// Pembuat plugin aktivitas RPG (mancing, berburu, nambang).
const rpg = require('./rpg');

function activityPlugin(key, aliases = []) {
  const activity = rpg.ACTIVITIES[key];
  return {
    name: key,
    category: 'ekonomi',
    aliases,
    async execute(sock, msg, args, ctx) {
      const { from, sender, getUser, updateUser, config } = ctx;
      const user = getUser(sender);
      const wait = rpg.cooldownLeft(user, key, activity.cooldown);
      if (wait > 0) {
        return sock.sendMessage(from, { text: `⏳ Kamu masih lelah. Bisa ${key} lagi dalam *${rpg.formatWait(wait)}*.` }, { quoted: msg });
      }
      const data = rpg.ensureRpg(user);
      data.cooldowns[key] = Date.now();
      const drop = rpg.rollDrop(activity);
      if (!drop) {
        updateUser(sender, { cooldowns: data.cooldowns });
        return sock.sendMessage(from, { text: `${activity.emoji} *${activity.title}*\n\n${activity.failText}` }, { quoted: msg });
      }
      const item = rpg.ITEMS[drop.item];
      data.inventory[drop.item] = (data.inventory[drop.item] || 0) + drop.amount;
      updateUser(sender, { cooldowns: data.cooldowns, inventory: data.inventory, exp: (user.exp || 0) + 5 });
      await sock.sendMessage(from, {
        text: `${activity.emoji} *${activity.title}*\n\nKamu mendapatkan *${drop.amount}× ${item.emoji} ${item.name}*\n` +
          `Harga jual: ${ctx.formatMoney(item.price)}/item\n\n🎒 *${config.prefix}inventory* · 💰 *${config.prefix}jual ${drop.item} all*`,
      }, { quoted: msg });
    },
  };
}

module.exports = { activityPlugin };
