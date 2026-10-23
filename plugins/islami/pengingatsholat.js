const islami = require('../../lib/islami');
const { requireGroupAdmin } = require('../../lib/group-utils');

module.exports = {
  name: 'pengingatsholat',
  category: 'islami',
  aliases: ['autosholat', 'remindsholat'],
  async execute(sock, msg, args, ctx) {
    const { from, config, getGroupSettings, updateGroupSettings } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false })) return;
    const input = args.join(' ').trim();
    const current = getGroupSettings(from).sholatReminder;

    if (!input) {
      return sock.sendMessage(from, {
        text: `🕌 *PENGINGAT SHOLAT*\n\nStatus: ${current?.cityId ? `✅ aktif — ${current.city}` : '❌ nonaktif'}\n\n` +
          `• *${config.prefix}pengingatsholat <kota>* — aktifkan\n• *${config.prefix}pengingatsholat off* — matikan\n\n` +
          'Bot akan mengirim pengingat saat masuk waktu Subuh, Dzuhur, Ashar, Maghrib, dan Isya.',
      }, { quoted: msg });
    }
    if (['off', 'mati', 'nonaktif'].includes(input.toLowerCase())) {
      updateGroupSettings(from, { sholatReminder: null });
      return sock.sendMessage(from, { text: '✅ Pengingat sholat dimatikan untuk grup ini.' }, { quoted: msg });
    }
    try {
      const city = await islami.searchCity(input);
      if (!city) return sock.sendMessage(from, { text: `❌ Kota *${input}* tidak ditemukan.` }, { quoted: msg });
      const timeZone = islami.timezoneForRegion(city.lokasi);
      let schedule = await islami.getSchedule(city.id, islami.dateInZone(timeZone).date);
      const localDate = islami.dateInZone(schedule.timeZone).date;
      if (localDate !== schedule.jadwal.date) schedule = await islami.getSchedule(city.id, localDate);
      updateGroupSettings(from, { sholatReminder: { cityId: city.id, city: schedule.lokasi, region: schedule.daerah } });
      const zone = islami.zoneLabel(schedule.timeZone);
      const times = islami.REMINDER_PRAYERS.map(name => `${name} ${schedule.jadwal[name]}`).join(' · ');
      await sock.sendMessage(from, {
        text: `✅ Pengingat sholat aktif untuk *${schedule.lokasi}* (${schedule.daerah}).\n\nHari ini (${zone}): ${times}`,
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengatur pengingat: ${error.message}` }, { quoted: msg });
    }
  },
};
