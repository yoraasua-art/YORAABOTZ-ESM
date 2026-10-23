const { getJson } = require('../../lib/http');

let cache = { base: null, at: 0, data: null };
const TTL = 60 * 60 * 1000;
const POPULAR = ['USD', 'EUR', 'SGD', 'MYR', 'JPY', 'SAR', 'CNY', 'KRW', 'AUD', 'GBP'];

async function rates(base) {
  if (cache.base === base && Date.now() - cache.at < TTL) return cache.data;
  const data = await getJson(`https://open.er-api.com/v6/latest/${base}`, {}, 15000);
  if (data.result !== 'success') throw new Error(data['error-type'] === 'unsupported-code' ? `Mata uang ${base} tidak dikenal.` : 'Data kurs tidak tersedia.');
  cache = { base, at: Date.now(), data };
  return data;
}

module.exports = {
  name: 'kurs',
  category: 'tools',
  aliases: ['currency', 'konversi', 'convert'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const fmt = (value, currency) => `${value.toLocaleString('id-ID', { maximumFractionDigits: value < 1 ? 6 : 2 })} ${currency}`;
    try {
      if (!args.length) {
        const data = await rates('IDR');
        const lines = POPULAR.map(code => `• 1 ${code} = ${fmt(1 / data.rates[code], 'IDR')}`);
        return sock.sendMessage(from, { text: `💱 *KURS HARI INI*\n\n${lines.join('\n')}\n\nKonversi: *${config.prefix}kurs 100 usd idr*\n_Update: ${data.time_last_update_utc}_` }, { quoted: msg });
      }
      const text = args.join(' ').toUpperCase().replace(/\bKE\b|\bTO\b/g, ' ');
      const match = text.match(/^([\d.,]+)?\s*([A-Z]{3})\s*([A-Z]{3})?$/);
      if (!match) return sock.sendMessage(from, { text: `Format: *${config.prefix}kurs <jumlah> <dari> <ke>*\nContoh: ${config.prefix}kurs 100 usd idr` }, { quoted: msg });
      const amount = match[1] ? Number(match[1].replace(/\./g, '').replace(',', '.')) : 1;
      const source = match[2];
      const target = match[3] || (source === 'IDR' ? 'USD' : 'IDR');
      if (!Number.isFinite(amount) || amount <= 0) return sock.sendMessage(from, { text: '❌ Jumlah tidak valid.' }, { quoted: msg });
      const data = await rates(source);
      const rate = data.rates[target];
      if (!rate) return sock.sendMessage(from, { text: `❌ Mata uang ${target} tidak dikenal.` }, { quoted: msg });
      await sock.sendMessage(from, { text: `💱 *KONVERSI KURS*\n\n${fmt(amount, source)}\n= *${fmt(amount * rate, target)}*\n\n1 ${source} = ${fmt(rate, target)}\n_Update: ${data.time_last_update_utc}_` }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil kurs: ${error.message}` }, { quoted: msg });
    }
  },
};
