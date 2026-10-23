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
      return ctx.reply('☁️ *UNDUH FILE GOOGLE DRIVE*\n\nGunakan: *.gdrive <tautan>*');
    }
    await ctx.reply('⏳ Mengambil file dari Google Drive...');
    const res = await downloadMultiPlatformNoKey('gdrive', url);
    if (!res.ok) return ctx.reply('❌ ' + res.error);
    return ctx.reply(`✅ *FILE GOOGLE DRIVE*\n\n📄 Nama file: *${res.title}*\n📦 Ukuran: *${res.size || '-'}*\n🔗 Tautan: ${res.url}`);
  }
};
module.exports.handler = module.exports.execute;
