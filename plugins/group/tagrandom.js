module.exports = {
  name: 'tagrandom',
  command: ['tagrandom', 'pickmember', 'undimember'],
  aliases: ['pickmember', 'undimember'],
  category: 'group',
  tags: ['group'],
  help: ['tagrandom', 'pickmember'],
  description: 'Memilih 1 anggota grup secara acak (cocok untuk arisan/giveaway/tunjuk orang)',
  async execute(ctx) {
    const keperluan = (ctx.args && ctx.args.join(' ')) || 'Terpilih secara acak oleh Bot!';
    const participants = (ctx.groupMetadata && ctx.groupMetadata.participants) || [];
    if (!participants.length) {
      return ctx.reply(`🎯 *UNDIAN MEMBER ACAK*\n\nKeperluan: *${keperluan}*\nPemenang: *${ctx.pushName || 'Member Beruntung'}* 🎉`);
    }
    const randomMember = participants[Math.floor(Math.random() * participants.length)];
    const jid = randomMember.id || randomMember.jid || '';
    const mentionTag = '@' + jid.split('@')[0];
    return ctx.reply(
      `🎯 *RANDOM MEMBER PICKER* 🎯\n\n` +
      `📌 Kategori: *${keperluan}*\n` +
      `🎉 Terpilih: ${mentionTag}\n\n` +
      `_Selamat kepada member yang terpilih!_`,
      { mentions: [jid] }
    );
  }
};
module.exports.handler = module.exports.execute;
