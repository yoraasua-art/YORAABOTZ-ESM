const { downloadMultiPlatformNoKey } = require('../../lib/free-no-key-downloader');

module.exports = {
  name: 'capcut',
  command: ['capcut', 'cc', 'ccdl'],
  aliases: ['cc', 'ccdl'],
  category: 'download',
  tags: ['download'],
  help: ['capcut <url>'],
  description: 'Download video template CapCut tanpa watermark & tanpa API Key',
  async execute(ctx) {
    const url = (ctx.args && ctx.args[0]) || '';
    if (!url || !/^https?:\/\//i.test(url)) {
      return ctx.reply('🎬 *CAPCUT NO WATERMARK (NO API KEY)*\n\nCara pakai: *.capcut <link_capcut>*');
    }
    await ctx.reply('⏳ _Mengunduh video CapCut..._');
    const res = await downloadMultiPlatformNoKey('capcut', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(`✅ *CAPCUT DOWNLOADER*\n\n🎬 Judul: *${res.title}*\n🔗 Video URL: ${res.url}`);
  }
};
module.exports.handler = module.exports.execute;
