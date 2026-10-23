const pm = require('../../lib/provider-manager');

function ownerOnly(ctx) {
  try { return Boolean(ctx.isSenderOwner && ctx.isSenderOwner()); } catch { return false; }
}

function render(c, prefix) {
  const lines = [
    '⚙️ *KONFIGURASI PROVIDER DOWNLOADER*',
    '',
    `⏱️ Timeout: ${c.global.timeoutMs} ms`,
    `🔁 Retry: ${c.global.retries}x`,
    `🔄 Health check: setiap ${Math.round((c.global.healthIntervalMs || 300000) / 1000)} detik`,
    `🚦 Download concurrency: ${c.global.downloadConcurrency || 2}`,
    `🧯 Circuit cooldown: ${Math.round((c.global.circuitCooldownMs || 60000) / 1000)} detik`,
    `🧠 Smart selection: ${c.global.smartSelection === false ? 'OFF' : 'ON'}`,
    '',
    '*Provider:*',
  ];
  for (const [name, p] of Object.entries(c.providers)) {
    lines.push(`${p.enabled ? '🟢' : '🔴'} ${name} — ${p.enabled ? 'ON' : 'OFF'}${p.endpoint ? `\n   ${p.endpoint}` : ''}`);
  }
  lines.push('', '*Prioritas:*');
  for (const [platform, chain] of Object.entries(c.chains)) lines.push(`• ${platform}: ${chain.join(' → ')}`);
  lines.push('', '*Command:*', `${prefix}providerconfig`, `${prefix}providerconfig on <provider>`, `${prefix}providerconfig off <provider>`, `${prefix}providerconfig timeout <ms>`, `${prefix}providerconfig retry <0-5>`, `${prefix}providerconfig healthinterval <detik>`, `${prefix}providerconfig concurrency <1-5>`, `${prefix}providerconfig cooldown <detik>`, `${prefix}providerconfig smart on|off`, `${prefix}providerstatus refresh`, `${prefix}providerconfig endpoint <provider> <url>`, `${prefix}providerconfig priority <youtube|tiktok|instagram> <provider,...>`, `${prefix}providerconfig reset`);
  return lines.join('\n');
}

module.exports = {
  name: 'providerconfig',
  category: 'owner',
  aliases: ['setprovider', 'dlproviderconfig', 'providerconf'],
  description: 'Mengatur provider downloader, endpoint, timeout, dan retry.',
  async execute(sock, msg, args, ctx) {
    if (!ownerOnly(ctx)) return sock.sendMessage(ctx.from, { text: '❌ Akses ditolak. Command ini hanya untuk owner.' }, { quoted: msg });
    const prefix = ctx.config.prefix;
    const sub = String(args[0] || '').toLowerCase();
    try {
      if (!sub || sub === 'list' || sub === 'show') {
        return sock.sendMessage(ctx.from, { text: render(pm.getConfig(), prefix) }, { quoted: msg });
      }
      if (sub === 'reset') {
        pm.reset();
        return sock.sendMessage(ctx.from, { text: '✅ Konfigurasi provider dikembalikan ke default.' }, { quoted: msg });
      }
      if (sub === 'on' || sub === 'off') {
        if (!args[1]) throw new Error(`Gunakan: ${prefix}providerconfig ${sub} <provider>`);
        pm.setProvider(String(args[1]).toLowerCase(), sub === 'on');
        return sock.sendMessage(ctx.from, { text: `✅ Provider *${args[1]}* sekarang ${sub === 'on' ? 'AKTIF' : 'NONAKTIF'}.` }, { quoted: msg });
      }
      if (sub === 'timeout') {
        pm.setGlobal('timeoutMs', args[1]);
        return sock.sendMessage(ctx.from, { text: `✅ Timeout provider diatur ke *${pm.getGlobal().timeoutMs} ms*.` }, { quoted: msg });
      }
      if (sub === 'retry') {
        pm.setGlobal('retries', args[1]);
        return sock.sendMessage(ctx.from, { text: `✅ Retry provider diatur ke *${pm.getGlobal().retries}x*.` }, { quoted: msg });
      }
      if (sub === 'healthinterval') {
        const seconds = Number(args[1]);
        if (!Number.isFinite(seconds)) throw new Error(`Gunakan: ${prefix}providerconfig healthinterval <detik>`);
        pm.setGlobal('healthIntervalMs', seconds * 1000);
        return sock.sendMessage(ctx.from, { text: `✅ Health check otomatis diatur setiap *${Math.round(pm.getGlobal().healthIntervalMs / 1000)} detik*.` }, { quoted: msg });
      }
      if (sub === 'concurrency') {
        pm.setGlobal('downloadConcurrency', args[1]);
        return sock.sendMessage(ctx.from, { text: `✅ Download concurrency diatur ke *${pm.getGlobal().downloadConcurrency}*.` }, { quoted: msg });
      }
      if (sub === 'cooldown') {
        const seconds = Number(args[1]);
        if (!Number.isFinite(seconds)) throw new Error(`Gunakan: ${prefix}providerconfig cooldown <detik>`);
        pm.setGlobal('circuitCooldownMs', seconds * 1000);
        return sock.sendMessage(ctx.from, { text: `✅ Circuit cooldown diatur ke *${Math.round(pm.getGlobal().circuitCooldownMs / 1000)} detik*.` }, { quoted: msg });
      }
      if (sub === 'smart') {
        const value = String(args[1] || '').toLowerCase();
        if (!['on','off'].includes(value)) throw new Error(`Gunakan: ${prefix}providerconfig smart on|off`);
        pm.setGlobal('smartSelection', value === 'on' ? 1 : 0);
        return sock.sendMessage(ctx.from, { text: `🧠 Smart provider selection *${value.toUpperCase()}*.` }, { quoted: msg });
      }
      if (sub === 'priority') {
        if (!args[1] || !args[2]) throw new Error(`Gunakan: ${prefix}providerconfig priority <platform> <provider1,provider2,...>`);
        const names = String(args[2]).split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
        pm.setChain(String(args[1]).toLowerCase(), names);
        return sock.sendMessage(ctx.from, { text: `✅ Prioritas *${args[1]}* diubah menjadi: ${names.join(' → ')}` }, { quoted: msg });
      }
      if (sub === 'endpoint') {
        if (!args[1] || !args[2]) throw new Error(`Gunakan: ${prefix}providerconfig endpoint <provider> <url>`);
        pm.setEndpoint(String(args[1]).toLowerCase(), args[2]);
        return sock.sendMessage(ctx.from, { text: `✅ Endpoint *${args[1]}* berhasil diubah.` }, { quoted: msg });
      }
      throw new Error('Subcommand tidak dikenal. Gunakan tanpa argumen untuk melihat bantuan.');
    } catch (e) {
      return sock.sendMessage(ctx.from, { text: `❌ ${e.message}\n\n${render(pm.getConfig(), prefix)}` }, { quoted: msg });
    }
  },
};
