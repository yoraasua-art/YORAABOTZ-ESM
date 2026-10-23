module.exports = {
  name: 'kodewarna',
  command: ['kodewarna', 'hexcolor'],
  aliases: ['hexcolor', 'randomcolor'],
  category: 'fun',
  tags: ['fun', 'random'],
  help: ['kodewarna'],
  description: 'Menghasilkan kode warna HEX acak untuk desain dan konten.',
  async execute(sock, msg, args, ctx) {
    const hex = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0').toUpperCase()}`;
    return sock.sendMessage(ctx.from, {
      text: `🎨 *RANDOM COLOR*\n\nKode HEX: \`${hex}\`\nRGB: ${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`,
    }, { quoted: msg });
  },
};
module.exports.handler = module.exports.execute;
