// Akses API Islami publik (tanpa key):
//  - Jadwal sholat : api.myquran.com (Kemenag)
//  - Al-Qur'an     : equran.id
const { getJson } = require('./http');

const MYQURAN = 'https://api.myquran.com/v2';
const EQURAN = 'https://equran.id/api/v2';
const PRAYERS = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'];
const REMINDER_PRAYERS = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

const WITA = ['BALI', 'NUSA TENGGARA BARAT', 'NTB', 'NUSA TENGGARA TIMUR', 'NTT', 'KALIMANTAN SELATAN', 'KALIMANTAN TIMUR', 'KALIMANTAN UTARA', 'SULAWESI', 'GORONTALO'];
const WIT = ['MALUKU', 'PAPUA'];

let surahListCache = null;
const surahCache = new Map();
const scheduleCache = new Map();

function timezoneForRegion(region) {
  const upper = String(region || '').toUpperCase();
  if (WIT.some(name => upper.includes(name))) return 'Asia/Jayapura';
  if (WITA.some(name => upper.includes(name))) return 'Asia/Makassar';
  return 'Asia/Jakarta';
}

function zoneLabel(timeZone) {
  return { 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }[timeZone] || 'WIB';
}

function dateInZone(timeZone, date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

async function searchCity(name) {
  const query = String(name || '').trim();
  if (!query) throw new Error('Nama kota kosong.');
  const json = await getJson(`${MYQURAN}/sholat/kota/cari/${encodeURIComponent(query)}`);
  const list = Array.isArray(json?.data) ? json.data : [];
  if (!json?.status || !list.length) return null;
  const exact = list.find(city => city.lokasi.toUpperCase().replace(/^(KOTA|KAB\.?)\s+/, '') === query.toUpperCase());
  return exact || list[0];
}

async function getSchedule(cityId, date) {
  const key = `${cityId}|${date}`;
  if (scheduleCache.has(key)) return scheduleCache.get(key);
  const json = await getJson(`${MYQURAN}/sholat/jadwal/${encodeURIComponent(cityId)}/${date}`);
  if (!json?.status || !json.data?.jadwal) throw new Error('Jadwal tidak ditemukan.');
  const result = { ...json.data, timeZone: timezoneForRegion(json.data.daerah) };
  scheduleCache.set(key, result);
  if (scheduleCache.size > 200) scheduleCache.delete(scheduleCache.keys().next().value);
  return result;
}

function nextPrayer(schedule, now = new Date()) {
  const { time } = dateInZone(schedule.timeZone, now);
  for (const name of REMINDER_PRAYERS) {
    if (schedule.jadwal[name] > time) return { name, time: schedule.jadwal[name] };
  }
  return null;
}

function normalizeSurahName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z]/g, '').replace(/^(al|an|ar|as|asy|at|az|ad|adz|ath)(?=[a-z]{3,})/, '');
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = temp;
    }
  }
  return row[b.length];
}

async function getSurahList() {
  if (surahListCache) return surahListCache;
  const json = await getJson(`${EQURAN}/surat`);
  if (!Array.isArray(json?.data) || json.data.length !== 114) throw new Error('Daftar surah tidak valid.');
  surahListCache = json.data;
  return surahListCache;
}

function matchSurah(list, query) {
  const text = String(query || '').trim();
  if (/^\d+$/.test(text)) return list.find(surah => surah.nomor === Number(text)) || null;
  const wanted = normalizeSurahName(text);
  if (!wanted) return null;
  let best = null;
  let bestScore = Infinity;
  for (const surah of list) {
    const name = normalizeSurahName(surah.namaLatin);
    if (name === wanted) return surah;
    const score = editDistance(name, wanted);
    if (score < bestScore) { best = surah; bestScore = score; }
  }
  return bestScore <= Math.max(1, Math.floor(wanted.length / 4)) ? best : null;
}

async function findSurah(query) {
  return matchSurah(await getSurahList(), query);
}

async function getSurah(number) {
  if (surahCache.has(number)) return surahCache.get(number);
  const json = await getJson(`${EQURAN}/surat/${number}`, {}, 20000);
  if (!json?.data?.ayat) throw new Error('Surah tidak ditemukan.');
  surahCache.set(number, json.data);
  if (surahCache.size > 30) surahCache.delete(surahCache.keys().next().value);
  return json.data;
}

function formatAyat(surah, ayat) {
  return `*${surah.namaLatin} : ${ayat.nomorAyat}*\n\n${ayat.teksArab}\n\n_${ayat.teksLatin}_\n\n"${ayat.teksIndonesia}"`;
}

module.exports = {
  PRAYERS, REMINDER_PRAYERS, timezoneForRegion, zoneLabel, dateInZone,
  searchCity, getSchedule, nextPrayer,
  normalizeSurahName, matchSurah, getSurahList, findSurah, getSurah, formatAyat,
};
