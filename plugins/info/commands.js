const { groupByCategory, countCommands } = require('../../lib/command-registry');

const categories = {
  download: '📥 DOWNLOAD', ekonomi: '💰 EKONOMI', fun: '🎭 FUN & RANDOM', game: '🎮 GAME',
  group: '🛡️ GRUP & ADMIN', info: 'ℹ️ INFORMASI', islami: '🕌 ISLAMI', level: '📊 LEVEL',
  menu: '📚 MENU', owner: '👑 OWNER', sticker: '🎨 STICKER', tools: '🛠️ TOOLS & UTILITAS',
};

module.exports = {
  name: 'commands',
  category: 'info',
  aliases: ['commandlist', 'cmds', 'allcmd', 'feature'],
  description: 'Daftar command dan alias yang tersedia sesuai hak akses pengguna.',
  async execute(sock, msg, args, ctx) {
    const { config, from, pluginList = [], isSenderOwner } = ctx;
    const owner = Boolean(isSenderOwner && isSenderOwner());
    const grouped = groupByCategory(pluginList, { includeOwner: owner });
    const prefix = config.prefix || '.';
    const total = countCommands(pluginList, { includeOwner: owner });
    const sections = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, entries]) => {
        const lines = [];
        for (const entry of entries) {
          const aliases = entry.aliases.length ? ` · ${entry.aliases.map(alias => `${prefix}${alias}`).join(', ')}` : '';
          lines.push(`• ${prefix}${entry.name}${aliases}`);
        }
        return `${categories[category] || `📦 ${category.toUpperCase()}`}\n${lines.join('\n')}`;
      });

    const text = [
      '╭━━━〔 ✦ *YORA BOTZ* 〕━━━╮',
      `│ 📚 *COMMAND CENTER*`,
      `│ 🧩 Plugin : *${pluginList.length}*`,
      `│ 🔑 Command: *${total}*`,
      `│ 👤 Akses  : *${owner ? 'Owner' : 'Member'}*`,
      '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
      '',
      sections.join('\n\n'),
      '',
      `💡 *${prefix}menu* — menu utama`,
      `📊 *${prefix}status* — status bot`,
      `🔎 Salah ketik? Bot akan memberi saran command terdekat.`,
    ].join('\n');

    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
