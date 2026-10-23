module.exports = {
  name: 'timestamp',
  command: ['timestamp', 'waktuunix'],
  aliases: ['waktuunix', 'unix', 'epoch'],
  category: 'tools',
  tags: ['tools', 'time'],
  help: ['timestamp'],
  description: 'Menampilkan waktu saat ini dalam format lokal, ISO, Unix detik, dan Unix milidetik.',
  async execute(sock, msg, args, ctx) {
    const now = Date.now();
    const date = new Date(now);
    const zone = ctx.config.timezone || 'Asia/Jakarta';
    const local = new Intl.DateTimeFormat('id-ID', {
      timeZone: zone,
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(date);
    return sock.sendMessage(ctx.from, {
      text: `🕐 *TIMESTAMP*\n\n` +
        `📅 Lokal: *${local}*\n` +
        `🌐 ISO: \`${date.toISOString()}\`\n` +
        `🔢 Unix: \`${Math.floor(now / 1000)}\`\n` +
        `🧮 Millis: \`${now}\``,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
