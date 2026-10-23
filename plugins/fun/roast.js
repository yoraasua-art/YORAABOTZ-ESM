const ROAST_LIST = [
  'HP-nya canggih sih, tapi dipakai cuma buat scroll sambil rebahan seharian 🤣',
  'Dompetnya setipis tisu dibagi dua, tapi gaya ngopinya kayak komisaris utama ☕💸',
  'Bilangnya "OTW", padahal handuk masih nempel di pundak baru mau mandi 🚿😂',
  'Sering bilang "Terserah", giliran dipilihin malah cemberut seharian 🗿',
  'Cita-cita jadi sultan, tapi bangun pagi aja masih kalah sama ayam tetangga 🐓✨',
  'Chat grup rame cuma nyimak doang, giliran ada giveaway paling cepet nongol 🎁🏃'
];

module.exports = {
  name: 'roast',
  command: ['roast', 'roasting', 'sindir'],
  aliases: ['roasting', 'sindir'],
  category: 'fun',
  tags: ['fun'],
  help: ['roast'],
  description: 'Roasting lucu dan santai untuk menghibur suasana grup',
  async execute(ctx) {
    const target = (ctx.args && ctx.args.join(' ')) || ctx.pushName || 'Teman Kita';
    const pick = ROAST_LIST[Math.floor(Math.random() * ROAST_LIST.length)];
    return ctx.reply(`🔥 *ROASTING SANTAI* 🔥\n\nTarget: *${target}*\n💬 "${pick}"\n\n_Canda ya jangan baper! 😆_`);
  }
};
module.exports.handler = module.exports.execute;
