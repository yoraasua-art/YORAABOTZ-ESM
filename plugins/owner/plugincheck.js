const { auditPlugins } = require('../../lib/plugin-health');

module.exports = {
  name: 'plugincheck',
  category: 'owner',
  aliases: ['pluginhealth', 'cekplugin'],
  async execute(sock, msg, args, ctx) {
    const { from, isSenderOwner, pluginList = [], config, pluginLoadStatus = {} } = ctx;
    if (!isSenderOwner()) {
      return sock.sendMessage(from, { text: '❌ Hanya owner yang dapat menjalankan pemeriksaan plugin.' }, { quoted: msg });
    }

    const audit = auditPlugins(pluginList);
    const status = audit.ok ? '✅ AMAN' : '⚠️ ADA MASALAH';
    const lines = [
      '╔══════════════════════════════════╗',
      '║       🔧 *PLUGIN HEALTH*         ║',
      '╚══════════════════════════════════╝',
      '',
      `Status: *${status}*`,
      `Plugin aktif: *${audit.totalPlugins}*`,
      `Command + alias: *${audit.totalCommands}*`,
      `Plugin gagal dimuat: *${pluginLoadStatus.failed || 0}*`,
    ];

    if ((pluginLoadStatus.failures || []).length) {
      lines.push('', '*Plugin gagal dimuat:*', ...(pluginLoadStatus.failures || []).slice(0, 20).map(item => `• ${item.file}: ${item.error}`));
      if ((pluginLoadStatus.failures || []).length > 20) lines.push(`• ... dan ${(pluginLoadStatus.failures || []).length - 20} plugin lainnya`);
    }

    if (audit.issues.length) {
      lines.push('', '*Masalah:*', ...audit.issues.slice(0, 30).map(item => `• ${item}`));
      if (audit.issues.length > 30) lines.push(`• ... dan ${audit.issues.length - 30} masalah lainnya`);
    } else {
      lines.push('', 'Semua plugin memiliki `name`, `execute()`, dan command/alias yang valid.', '',
        `Gunakan *${config.prefix}reloadplugins* setelah memasang atau mengubah plugin.`);
    }

    await sock.sendMessage(from, { text: lines.join('\n') }, { quoted: msg });
  },
};
