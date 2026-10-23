const { downloadMultiPlatformNoKey } = require('../../lib/free-no-key-downloader');

module.exports = {
  name: 'gdrive',
  command: ['gdrive', 'drive', 'gdrivedl'],
  aliases: ['drive', 'gdrivedl'],
  category: 'download',
  tags: ['download'],
  help: ['gdrive <url>'],
  description: 'Download file Google Drive direct link tanpa API Key',
  async execute(ctx) {
    const url = (ctx.args && ctx.args[0]) || '';
    if (!url || !url.includes('drive.google.com')) {
      return ctx.reply('☁️ *GOOGLE DRIVE DOWNLOADER (NO API KEY)*\n\nCara pakai: *.gdrive <link_google_drive>*');
    }
    await ctx.reply('⏳ _Memproses link Google Drive..._');
    const res = await downloadMultiPlatformNoKey('gdrive', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(`✅ *GOOGLE DRIVE DIRECT*\n\n📄 Nama: *${res.title}*\n📦 Ukuran: *${res.size || '-'}*\n🔗 Download: ${res.url}`);
  }
};
module.exports.handler = module.exports.execute;
