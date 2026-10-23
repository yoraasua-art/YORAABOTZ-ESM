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
      return ctx.reply('🎬 *UNDUH VIDEO CAPCUT TANPA WATERMARK*\n\nGunakan: *.capcut <tautan>*');
    }
    await ctx.reply('⏳ _Mengunduh video CapCut..._');
    const res = await downloadMultiPlatformNoKey('capcut', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(`✅ *VIDEO CAPCUT*\n\n🎬 Judul: *${res.title}*\n🔗 Tautan video: ${res.url}`);
  }
};
module.exports.handler = module.exports.execute;
