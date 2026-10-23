module.exports = {
  name: 'tebakumur',
  command: ['tebakumur', 'cekumur'],
  aliases: ['cekumur'],
  category: 'fun',
  tags: ['fun'],
  help: ['tebakumur'],
  description: 'Menebak umur dan aura kedewasaan seseorang secara seru',
  async execute(ctx) {
    const nama = (ctx.args && ctx.args.join(' ')) || ctx.pushName || 'Member';
    const umurFisik = Math.floor(14 + Math.random() * 28);
    const umurMental = Math.floor(10 + Math.random() * 55);
    const julukan = [
      'Jiwa Muda Energik ⚡',
      'Dewasa Bijaksana 🦉',
      'Masih Suka Ngambek 🍭',
      'Aura Pemimpin Masa Depan 👑',
      'Santai Tapi Pasti Sukses ☕'
    ][Math.floor(Math.random() * 5)];

    return ctx.reply(
      `🎂 *DETEKTOR UMUR & AURA* 🎂\n\n` +
      `👤 Target: *${nama}*\n` +
      `🪪 Tebakan Umur: *${umurFisik} Tahun*\n` +
      `🧠 Umur Mental: *${umurMental} Tahun*\n` +
      `✨ Karakter: *${julukan}*`
    );
  }
};
module.exports.handler = module.exports.execute;
