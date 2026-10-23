const { downloadMultiPlatformNoKey } = require('../../lib/free-no-key-downloader');

module.exports = {
  name: 'mediafire',
  command: ['mediafire', 'mf', 'mfdl'],
  aliases: ['mf', 'mfdl'],
  category: 'download',
  tags: ['download'],
  help: ['mediafire <url>', 'mf <url>'],
  description: 'Download file dari MediaFire gratis tanpa API Key',
  async execute(ctx) {
    const url = (ctx.args && ctx.args[0]) || '';
    if (!url || !url.includes('mediafire.com')) {
      return ctx.reply('📥 *UNDUH FILE MEDIAFIRE*\n\nGunakan: *.mediafire <tautan>*');
    }
    await ctx.reply('⏳ Mengambil file dari MediaFire...');
    const res = await downloadMultiPlatformNoKey('mediafire', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(
      `✅ *FILE MEDIAFIRE*\n\n` +
      `📄 Nama file: *${res.title}*\n` +
      `📦 Ukuran: *${res.size || '-'}*\n` +
      `🔗 Tautan: ${res.url}`
    );
  }
};
module.exports.handler = module.exports.execute;
