module.exports = {
  name: 'about',
  category: 'info',
  aliases: ['profilebot', 'tentang'],
  async execute(sock, msg, args, ctx) {
    const { config, from, pluginList } = ctx;
    const uptime = process.uptime();
    const jam = Math.floor(uptime / 3600);
    const menit = Math.floor((uptime % 3600) / 60);
    const detik = Math.floor(uptime % 60);

    const text = `╔══════════════════════════════════════╗
║      🤖  *ABOUT ${config.botName.toUpperCase()}*  🤖
╚══════════════════════════════════════╝

  ◆  👤  Owner      : *${config.ownerName}*
  ◆  📞  Nomor      : *${config.ownerNumber}*
  ◆  🌐  Website    : ${config.website}
  ◆  ⏱️  Uptime     : *${jam}h ${menit}m ${detik}s*
  ◆  🧠  Plugin     : *${(pluginList || []).length}*
  ◆  🛡️  Status     : *Online*

  ${config.botName} adalah bot WhatsApp multipurpose yang dirancang untuk membantu komunitas dengan fitur game, ekonomi, grup, tools, dan premium system.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await sock.sendMessage(from, { text });
  },
};
