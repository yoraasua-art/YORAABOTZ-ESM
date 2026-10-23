const pm = require('../../lib/provider-manager');
const { hasYtDlp } = require('../../lib/downloader');
const runtime = require('../../lib/download-runtime');
const performanceStats = require('../../lib/performance-stats');

const STATUS_ICON = { healthy: '🟢', degraded: '🟡', unavailable: '🔴', disabled: '⚪', unknown: '⚪' };
const STATUS_TEXT = { healthy: 'HEALTHY', degraded: 'DEGRADED', unavailable: 'UNAVAILABLE', disabled: 'DISABLED', unknown: 'UNKNOWN' };

function fmtTime(ts) {
  if (!ts) return 'belum dicek';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

module.exports = {
  name: 'providerstatus',
  category: 'download',
  aliases: ['provider', 'providerstat', 'dlproviderstatus'],
  description: 'Melihat health status provider downloader dan prioritas fallback.',
  async execute(sock, msg, args, ctx) {
    if (String(args[0] || '').toLowerCase() === 'refresh') {
      await pm.checkAllHealth({ force: true });
    } else {
      await pm.checkAllHealth();
    }
    const c = pm.getConfig();
    const health = Object.fromEntries(Object.keys(c.providers).map(name => [name, pm.getHealth(name)]));
    const lines = [
      '📡 *HEALTH STATUS PROVIDER DOWNLOADER*',
      '',
      `⏱️ Timeout : ${c.global.timeoutMs} ms`,
      `🔁 Retry   : ${c.global.retries}x`,
      `🔄 Health  : setiap ${Math.round((c.global.healthIntervalMs || 300000) / 1000)} detik`,
      `🚦 Concurrency: ${c.global.downloadConcurrency || 2}`,
      `🧯 Cooldown: ${Math.round((c.global.circuitCooldownMs || 60000) / 1000)} detik`,
      `🧠 Smart Select: ${c.global.smartSelection === false ? 'OFF' : 'ON'}`,
      '',
      '📋 *Provider*',
    ];
    for (const [name, p] of Object.entries(c.providers)) {
      const h = health[name] || { status: 'unknown', latencyMs: null, detail: 'Belum dicek' };
      const latency = Number.isFinite(h.latencyMs) ? ` · ${h.latencyMs}ms` : '';
      lines.push(`${STATUS_ICON[h.status] || '⚪'} ${p.label} — *${STATUS_TEXT[h.status] || String(h.status).toUpperCase()}*${latency}`);
      lines.push(`   ↳ ${h.detail || '—'}${h.checkedAt ? ` · cek ${fmtTime(h.checkedAt)}` : ''}`);
      if (p.endpoint) lines.push(`   ↳ ${p.endpoint}`);
    }
    const rt = runtime.getRuntimeStats();
    lines.push('', '🧠 *SMART PROVIDER*');
    for (const item of performanceStats.getProviderStatsAll().slice(0, 8)) {
      const rate = Number.isFinite(item.successRate) ? `${(item.successRate * 100).toFixed(0)}%` : '-';
      const avg = Number.isFinite(item.averageLatencyMs) ? `${Math.round(item.averageLatencyMs)}ms` : '-';
      lines.push(`• ${item.provider}: score ${item.score} · sukses ${rate} · avg ${avg}`);
    }
    lines.push('', '🛡️ *RUNTIME STABILITY*', `• Aktif: ${rt.active}`, `• Antrean: ${rt.queued}`);
    for (const [name, st] of Object.entries(rt.circuits)) {
      if (st.open) lines.push(`• ${name}: 🧯 COOLDOWN (${Math.max(0, Math.ceil((st.openedUntil - Date.now()) / 1000))}s)`);
    }
    lines.push('', '🔀 *Prioritas Fallback*');
    for (const [platform, chain] of Object.entries(c.chains)) {
      const rendered = chain.map(name => {
        const h = health[name];
        const icon = STATUS_ICON[h?.status] || '⚪';
        return `${icon}${name}`;
      }).join(' → ');
      lines.push(`• ${platform}: ${rendered}`);
    }
    lines.push('', 'ℹ️ Provider *UNAVAILABLE* otomatis dilewati saat download. *DEGRADED* masih dicoba sebelum fallback berikutnya.', `🔄 ${ctx.config.prefix}providerstatus refresh — cek ulang sekarang`, `👑 ${ctx.config.prefix}providerconfig — konfigurasi provider (owner)`);
    return sock.sendMessage(ctx.from, { text: lines.join('\n') }, { quoted: msg });
  },
};
