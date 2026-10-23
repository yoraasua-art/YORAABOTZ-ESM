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
      return ctx.reply('📥 *MEDIAFIRE DOWNLOADER (NO API KEY)*\n\nCara pakai: *.mediafire <link_mediafire>*');
    }
    await ctx.reply('⏳ _Sedang mengambil file dari MediaFire tanpa API Key..._');
    const res = await downloadMultiPlatformNoKey('mediafire', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(
      `✅ *MEDIAFIRE DOWNLOADER*\n\n` +
      `📄 Nama File: *${res.title}*\n` +
      `📦 Ukuran: *${res.size || '-'}*\n` +
      `🔗 Link Direct: ${res.url}`
    );
  }
};
module.exports.handler = module.exports.execute;
