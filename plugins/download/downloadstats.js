const performanceStats = require('../../lib/performance-stats');
const runtime = require('../../lib/download-runtime');

module.exports = {
  name: 'downloadstats',
  category: 'download',
  aliases: ['dlstats', 'providerstats', 'downloadstat'],
  description: 'Melihat performa provider downloader.',
  async execute(sock, msg, args, ctx) {
    const rows = performanceStats.getProviderStatsAll();
    const rt = runtime.getRuntimeStats();
    const lines = ['📊 *DOWNLOAD PERFORMANCE*', '', `⚡ Aktif: ${rt.active}`, `⏳ Antrean: ${rt.queued}`, ''];
    if (!rows.length) lines.push('Belum ada data download provider.');
    else rows.slice(0, 10).forEach((r, i) => {
      const rate = Number.isFinite(r.successRate) ? `${(r.successRate * 100).toFixed(1)}%` : '-';
      const avg = Number.isFinite(r.averageLatencyMs) ? `${Math.round(r.averageLatencyMs)}ms` : '-';
      lines.push(`${i + 1}. *${r.provider}* — score ${r.score}`, `   Sukses: ${rate} · Avg: ${avg} · Request: ${r.attempts}`);
    });
    lines.push('', '🧠 Provider dipilih berdasarkan health, success rate, latency, dan prioritas konfigurasi.');
    await sock.sendMessage(ctx.from, { text: lines.join('\n') }, { quoted: msg });
  },
};
