const FAKTA_SAINS = [
  'Cahaya Matahari membutuhkan waktu sekitar 8 menit 20 detik untuk sampai ke permukaan Bumi.',
  'Gurita memiliki 3 jantung, 9 otak mini di tentakelnya, dan darah berwarna biru.',
  'Madu murni tidak pernah basi meskipun disimpan selama ribuan tahun dalam wadah tertutup.',
  'Satu sendok teh materi dari bintang Neutron memiliki berat sekitar 6 miliar ton.',
  'Pohon bambu tertentu dapat tumbuh hingga 90 cm hanya dalam waktu 24 jam.',
  'Petir memiliki suhu hingga 30.000 derajat Celcius, atau 5 kali lebih panas dari permukaan Matahari.',
  'DNA manusia memiliki kemiripan sekitar 60% dengan struktur genetik buah pisang.',
  'Di planet Venus, satu hari (rotasi) lebih lama daripada satu tahunnya (revolusi mengelilingi Matahari).'
];

module.exports = {
  name: 'faktailmiah',
  command: ['faktailmiah', 'sains', 'ensiklopedia'],
  aliases: ['sains', 'ensiklopedia'],
  category: 'tools',
  tags: ['tools'],
  help: ['faktailmiah', 'sains'],
  description: 'Menampilkan ensiklopedia fakta ilmiah & sains dunia secara acak',
  async execute(ctx) {
    const pick = FAKTA_SAINS[Math.floor(Math.random() * FAKTA_SAINS.length)];
    return ctx.reply(`🔬 *ENSIKLOPEDIA FAKTA ILMIAH & SAINS*\n\n💡 ${pick}`);
  }
};
module.exports.handler = module.exports.execute;
