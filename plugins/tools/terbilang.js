function terbilang(n) {
  const angka = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  n = Math.floor(Number(n));
  if (!Number.isFinite(n)) return null;
  if (n < 12) return angka[n];
  if (n < 20) return `${terbilang(n - 10)} belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} puluh${n % 10 ? ` ${terbilang(n % 10)}` : ''}`;
  if (n < 200) return `seratus${n % 100 ? ` ${terbilang(n % 100)}` : ''}`;
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} ratus${n % 100 ? ` ${terbilang(n % 100)}` : ''}`;
  if (n < 2000) return `seribu${n % 1000 ? ` ${terbilang(n % 1000)}` : ''}`;
  if (n < 1_000_000) return `${terbilang(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${terbilang(n % 1000)}` : ''}`;
  if (n < 1_000_000_000) return `${terbilang(Math.floor(n / 1_000_000))} juta${n % 1_000_000 ? ` ${terbilang(n % 1_000_000)}` : ''}`;
  if (n < 1_000_000_000_000) return `${terbilang(Math.floor(n / 1_000_000_000))} miliar${n % 1_000_000_000 ? ` ${terbilang(n % 1_000_000_000)}` : ''}`;
  if (n < 1_000_000_000_000_000) return `${terbilang(Math.floor(n / 1_000_000_000_000))} triliun${n % 1_000_000_000_000 ? ` ${terbilang(n % 1_000_000_000_000)}` : ''}`;
  return null;
}

module.exports = {
  name: 'terbilang',
  command: ['terbilang', 'angka2kata'],
  aliases: ['angka2kata', 'nominal'],
  category: 'tools',
  tags: ['tools', 'angka'],
  help: ['terbilang <angka>'],
  description: 'Mengubah angka menjadi tulisan bahasa Indonesia.',
  async execute(sock, msg, args, ctx) {
    const raw = args.join('').replace(/[.,\s]/g, '');
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value > 999_999_999_999_999) {
      return sock.sendMessage(ctx.from, { text: `❌ Masukkan angka 0–999.999.999.999.999.\nContoh: ${ctx.config.prefix}terbilang 125000` }, { quoted: msg });
    }
    return sock.sendMessage(ctx.from, {
      text: `🔢 *TERBILANG*\n\nAngka: *${value.toLocaleString('id-ID')}*\nTulisan: *${terbilang(value)}*`,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
