module.exports = {
  name: 'textcase',
  command: ['textcase', 'case'],
  aliases: ['case', 'ubahteks'],
  category: 'tools',
  tags: ['tools', 'text'],
  help: ['textcase upper <teks>', 'textcase lower <teks>', 'textcase title <teks>'],
  description: 'Mengubah format huruf teks menjadi upper, lower, atau title case.',
  async execute(sock, msg, args, ctx) {
    const mode = String(args[0] || 'title').toLowerCase();
    const input = args.slice(1).join(' ').trim();
    if (!input || !['upper', 'lower', 'title'].includes(mode)) {
      return sock.sendMessage(ctx.from, {
        text: `🔤 *TEXT CASE*\n\n• ${ctx.config.prefix}textcase upper <teks>\n• ${ctx.config.prefix}textcase lower <teks>\n• ${ctx.config.prefix}textcase title <teks>`,
      }, { quoted: msg });
    }
    let output = input;
    if (mode === 'upper') output = input.toUpperCase();
    if (mode === 'lower') output = input.toLowerCase();
    if (mode === 'title') output = input.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, c => c.toUpperCase());
    return sock.sendMessage(ctx.from, { text: `🔤 *${mode.toUpperCase()} CASE*\n\n${output}` }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
