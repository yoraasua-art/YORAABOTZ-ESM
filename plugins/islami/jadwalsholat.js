const islami = require('../../lib/islami');

module.exports = {
  name: 'jadwalsholat',
  category: 'islami',
  aliases: ['sholat', 'jadwalshalat', 'waktusholat'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const city = args.join(' ').trim();
    if (!city) {
      return sock.sendMessage(from, { text: `🕌 Masukkan nama kota.\nContoh: *${config.prefix}jadwalsholat jakarta*` }, { quoted: msg });
    }
    try {
      const found = await islami.searchCity(city);
      if (!found) return sock.sendMessage(from, { text: `❌ Kota *${city}* tidak ditemukan. Coba nama kota/kabupaten lain.` }, { quoted: msg });
      const timeZone = islami.timezoneForRegion(found.lokasi);
      const { date } = islami.dateInZone(timeZone);
      let schedule = await islami.getSchedule(found.id, date);
      const localDate = islami.dateInZone(schedule.timeZone).date;
      if (localDate !== date) schedule = await islami.getSchedule(found.id, localDate);
      const zone = islami.zoneLabel(schedule.timeZone);
      const next = islami.nextPrayer(schedule);
      const lines = islami.PRAYERS.map(name => `${next?.name === name ? '▶️' : '•'} ${name[0].toUpperCase()}${name.slice(1)}: *${schedule.jadwal[name]}*`);
      await sock.sendMessage(from, {
        text: `🕌 *JADWAL SHOLAT*\n\n📍 ${schedule.lokasi}, ${schedule.daerah}\n📅 ${schedule.jadwal.tanggal}\n\n${lines.join('\n')}\n\n` +
          `${next ? `⏳ Berikutnya: *${next.name}* pukul ${next.time} ${zone}` : '🌙 Semua waktu sholat hari ini sudah lewat.'}\n` +
          `_Waktu dalam ${zone}. Sumber: Kemenag RI (myquran.com)_\n\n💡 Admin bisa aktifkan pengingat otomatis: *${config.prefix}pengingatsholat ${city}*`,
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil jadwal sholat: ${error.message}` }, { quoted: msg });
    }
  },
};
