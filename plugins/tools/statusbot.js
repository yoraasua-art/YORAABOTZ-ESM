const fs = require('fs');
const path = require('path');
const { countCommands } = require('../../lib/command-registry');

function countUsers() {
  try {
    const userFile = path.join(__dirname, '..', '..', 'database', 'users.json');
    if (!fs.existsSync(userFile)) return 0;
    const data = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    return data && typeof data === 'object' ? Object.keys(data).length : 0;
  } catch { return 0; }
}

module.exports = {
  name: 'statusbot',
  category: 'tools',
  aliases: ['botstatus', 'health', 'bothealth', 'status'],
  description: 'Dashboard status bot dengan runtime, plugin, command, dan memori.',
  async execute(sock, msg, args, ctx) {
    const { from, config, pluginList = [], pluginLoadStatus = {}, isSenderOwner } = ctx;
    const owner = Boolean(isSenderOwner && isSenderOwner());
    const uptime = Math.floor(process.uptime());
    const jam = Math.floor(uptime / 3600);
    const menit = Math.floor((uptime % 3600) / 60);
    const detik = uptime % 60;
    const mem = process.memoryUsage();
    const loaded = Number(pluginLoadStatus.loaded || pluginList.length);
    const failed = Number(pluginLoadStatus.failed || 0);
    const commands = countCommands(pluginList, { includeOwner: owner });
    const connectionState = sock?.user?.id ? 'ONLINE' : 'STARTING';
    const dbReady = fs.existsSync(path.join(__dirname, '..', '..', 'database', 'users.json'));

    const text = [
      `╭━━━〔 ✦ *${config.botName || 'Yora Botz'}* 〕━━━╮`,
      `│ 📡 Koneksi  : *${connectionState}*`,
      `│ ⏱️ Uptime   : *${jam}j ${menit}m ${detik}d*`,
      `│ 🧩 Plugin   : *${loaded} aktif*${failed ? ` · ⚠️ ${failed} gagal` : ' · ✅ sehat'}`,
      `│ ⚡ Command  : *${commands}*`,
      `│ 🧠 RAM      : *${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB*`,
      `│ 👥 Pengguna : *${countUsers()}*`,
      `│ 🗄️ Database : *${dbReady ? 'READY' : 'EMPTY'}*`,
      '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
      '',
      failed ? `⚠️ Ada plugin gagal dimuat. Owner dapat menjalankan *${config.prefix}plugincheck*.` : '✨ Semua plugin aktif dan registry command siap digunakan.',
      `💡 Ketik *${config.prefix}commands* untuk command yang tersedia.`,
    ].join('\n');

    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
