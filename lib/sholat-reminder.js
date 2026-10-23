// Pengingat waktu sholat otomatis per grup.
// Pengaturan disimpan di groups.json → sholatReminder: { cityId, city, region }
const database = require('./database');
const islami = require('./islami');

const TICK_MS = 30 * 1000;
const sent = new Map();
let timer = null;
let currentSock = null;

const LABELS = { subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya' };

function reminderText(prayer, schedule) {
  const zone = islami.zoneLabel(schedule.timeZone);
  return `🕌 *WAKTU SHOLAT ${LABELS[prayer].toUpperCase()}*\n\n` +
    `Telah masuk waktu sholat ${LABELS[prayer]} untuk wilayah *${schedule.lokasi}* dan sekitarnya ` +
    `(${schedule.jadwal[prayer]} ${zone}).\n\nYuk tinggalkan sejenak aktivitas dan tunaikan sholat. 🤲`;
}

async function checkReminders(sock = currentSock, now = new Date()) {
  if (!sock) return 0;
  const groups = database.loadGroups();
  let count = 0;
  for (const [groupId, settings] of Object.entries(groups)) {
    const reminder = settings?.sholatReminder;
    if (!reminder?.cityId) continue;
    try {
      const timeZone = islami.timezoneForRegion(reminder.region);
      const { date, time } = islami.dateInZone(timeZone, now);
      const schedule = await islami.getSchedule(reminder.cityId, date);
      for (const prayer of islami.REMINDER_PRAYERS) {
        if (schedule.jadwal[prayer] !== time) continue;
        const key = `${groupId}|${date}|${prayer}`;
        if (sent.has(key)) continue;
        sent.set(key, Date.now());
        await sock.sendMessage(groupId, { text: reminderText(prayer, schedule) });
        count++;
      }
    } catch (error) {
      console.error(`⚠️ Pengingat sholat ${groupId}: ${error.message}`);
    }
  }
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, at] of sent) if (at < dayAgo) sent.delete(key);
  return count;
}

function startSholatReminder(sock) {
  currentSock = sock;
  if (timer) return;
  timer = setInterval(() => { checkReminders().catch(() => {}); }, TICK_MS);
  if (timer.unref) timer.unref();
}

function stopSholatReminder() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startSholatReminder, stopSholatReminder, checkReminders, reminderText, sent };
