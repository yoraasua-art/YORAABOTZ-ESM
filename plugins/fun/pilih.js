module.exports = {
  name: 'pilih',
  command: ['pilih', 'choose', 'randompick'],
  aliases: ['choose', 'randompick', 'acakpilihan'],
  category: 'fun',
  tags: ['fun', 'random'],
  help: ['pilih opsi1 | opsi2 | opsi3'],
  description: 'Memilih satu opsi secara acak dari daftar pilihan yang dipisahkan tanda |.',
  async execute(sock, msg, args, ctx) {
    const input = args.join(' ').trim();
    const choices = input.split('|').map(item => item.trim()).filter(Boolean);
    if (choices.length < 2) {
      return sock.sendMessage(ctx.from, {
        text: `🎯 *RANDOM PICKER*\n\nContoh:\n${ctx.config.prefix}pilih nasi goreng | mie ayam | bakso`,
      }, { quoted: msg });
    }
    const winner = choices[Math.floor(Math.random() * choices.length)];
    return sock.sendMessage(ctx.from, {
      text: `🎯 *HASIL RANDOM PICKER*\n\n${choices.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n🏆 Pilihan: *${winner}*`,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
