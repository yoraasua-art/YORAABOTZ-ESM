module.exports = {
  name: 'cekkeberuntungan',
  command: ['cekkeberuntungan', 'cekhoki', 'hoki'],
  aliases: ['cekhoki', 'hoki'],
  category: 'fun',
  tags: ['fun'],
  help: ['cekkeberuntungan', 'cekhoki'],
  description: 'Cek persentase hoki dan keberuntunganmu hari ini',
  async execute(ctx) {
    const targetName = (ctx.args && ctx.args.join(' ')) || ctx.pushName || 'Kamu';
    const persen = Math.floor(Math.random() * 101);
    const angkaHoki = Math.floor(10 + Math.random() * 89);
    const warnaList = ['Biru Langit', 'Hijau Emerald', 'Emas', 'Merah Maroon', 'Ungu Neon', 'Putih Mutiara', 'Hitam Elegan'];
    const warna = warnaList[Math.floor(Math.random() * warnaList.length)];

    let status = 'Lumayan Hoki ✨';
    if (persen >= 85) status = 'SULTAN HOKI MAKSIMAL 🔥🍀';
    else if (persen >= 60) status = 'Keberuntungan Tinggi 🌟';
    else if (persen < 30) status = 'Waspada Kurang Beruntung, Banyak Berdoa 🤲';

    return ctx.reply(
      `🍀 *CEK KEBERUNTUNGAN HARI INI* 🍀\n\n` +
      `👤 Nama: *${targetName}*\n` +
      `📊 Tingkat Hoki: *${persen}%*\n` +
      `🎨 Warna Keberuntungan: *${warna}*\n` +
      `🔢 Angka Hoki: *${angkaHoki}*\n` +
      `🏷️ Predikat: *${status}*`
    );
  }
};
module.exports.handler = module.exports.execute;
