const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');

function dependencyStatus(name) {
  try {
    require.resolve(name);
    return `✅ ${name}`;
  } catch {
    return `❌ ${name} — belum terpasang`;
  }
}

module.exports = {
  name: 'systemcheck',
  category: 'owner',
  aliases: ['syscheck', 'cekserver', 'healthcheck'],
  description: 'Pemeriksaan dependency, FFmpeg, konfigurasi, dan plugin.',
  async execute(sock, msg, args, ctx) {
    const { from, isSenderOwner, config, pluginList = [], pluginLoadStatus = {} } = ctx;
    if (!isSenderOwner()) return sock.sendMessage(from, { text: '❌ Command ini hanya untuk owner.' }, { quoted: msg });

    const required = ['@whiskeysockets/baileys', '@hapi/boom', 'pino', 'sharp', 'qrcode', 'wa-sticker-formatter'];
    const checks = required.map(dependencyStatus);
    const ffmpeg = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
    const folders = ['database', 'session', 'assets', 'plugins'].map(folder => {
      const exists = fs.existsSync(path.join(process.cwd(), folder));
      return `${exists ? '✅' : '❌'} ${folder}`;
    });
    const failed = Number(pluginLoadStatus.failed || 0);
    const ok = checks.every(line => line.startsWith('✅')) && ffmpeg && failed === 0 && config?.prefix;

    const text = [
      '╭━━━〔 🩺 *SYSTEM CHECK* 〕━━━╮',
      `│ Overall: *${ok ? 'READY ✅' : 'NEEDS ATTENTION ⚠️'}*`,
      `│ Prefix : *${config.prefix || 'tidak ada'}*`,
      `│ Plugins: *${pluginList.length} loaded*${failed ? ` · ${failed} failed` : ''}`,
      '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
      '',
      '*Dependencies*',
      ...checks,
      `${ffmpeg ? '✅' : '❌'} FFmpeg`,
      '',
      '*Project folders*',
      ...folders,
      '',
      ok ? '✨ Sistem siap dijalankan.' : '⚠️ Jalankan `npm install` lalu cek kembali sebelum deployment.',
    ].join('\n');
    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
