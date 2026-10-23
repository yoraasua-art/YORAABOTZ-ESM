const DATA = [
  { q: 'Sebutkan sesuatu yang biasa dibawa ke sekolah!', jawab: ['tas', 'buku', 'pulpen', 'pensil', 'buku tulis', 'penghapus'] },
  { q: 'Sebutkan hewan yang ada di kebun binatang!', jawab: ['singa', 'gajah', 'jerapah', 'harimau', 'monyet', 'zebra'] },
  { q: 'Sebutkan buah berwarna merah!', jawab: ['apel', 'stroberi', 'semangka', 'ceri', 'tomat', 'delima'] },
  { q: 'Sebutkan benda yang ada di dapur!', jawab: ['kompor', 'panci', 'wajan', 'pisau', 'sendok', 'piring'] },
  { q: 'Sebutkan alat transportasi darat!', jawab: ['mobil', 'motor', 'bus', 'sepeda', 'kereta', 'truk'] },
  { q: 'Sebutkan pekerjaan yang memakai seragam!', jawab: ['polisi', 'tentara', 'dokter', 'perawat', 'satpam', 'pramugari'] },
  { q: 'Sebutkan warna pelangi!', jawab: ['merah', 'jingga', 'kuning', 'hijau', 'biru', 'nila', 'ungu'] },
  { q: 'Sebutkan olahraga yang memakai bola!', jawab: ['sepak bola', 'basket', 'voli', 'tenis', 'bulu tangkis', 'futsal'] },
  { q: 'Sebutkan benda yang bisa terbang!', jawab: ['pesawat', 'burung', 'helikopter', 'balon', 'roket', 'layang layang'] },
  { q: 'Sebutkan makanan khas Indonesia!', jawab: ['nasi goreng', 'sate', 'rendang', 'soto', 'bakso', 'gado gado'] },
  { q: 'Sebutkan planet di tata surya!', jawab: ['merkurius', 'venus', 'bumi', 'mars', 'jupiter', 'saturnus', 'uranus', 'neptunus'] },
  { q: 'Sebutkan sesuatu yang berwarna putih!', jawab: ['salju', 'kapas', 'susu', 'awan', 'kertas', 'beras'] },
  { q: 'Sebutkan anggota tubuh!', jawab: ['kepala', 'tangan', 'kaki', 'mata', 'hidung', 'mulut', 'telinga'] },
  { q: 'Sebutkan hal yang dilakukan saat pagi hari!', jawab: ['mandi', 'sarapan', 'sholat subuh', 'berolahraga', 'berangkat kerja', 'minum kopi'] },
  { q: 'Sebutkan hewan yang hidup di air!', jawab: ['ikan', 'hiu', 'paus', 'dolphin', 'gurita', 'kura kura'] },
  { q: 'Sebutkan benda elektronik di rumah!', jawab: ['tv', 'kulkas', 'mesin cuci', 'ac', 'setrika', 'kipas angin'] },
  { q: 'Sebutkan profesi di bidang kesehatan!', jawab: ['dokter', 'perawat', 'bidan', 'apoteker', 'dokter gigi', 'ahli gizi'] },
  { q: 'Sebutkan sesuatu yang bisa membuat bahagia!', jawab: ['keluarga', 'teman', 'uang', 'makanan', 'liburan', 'cinta'] },
  { q: 'Sebutkan tempat wisata di Indonesia!', jawab: ['bali', 'borobudur', 'raja ampat', 'danau toba', 'bromo', 'labuan bajo'] },
  { q: 'Sebutkan minuman yang menyegarkan!', jawab: ['es teh', 'jus', 'air kelapa', 'soda', 'es jeruk', 'smoothie'] },
  { q: 'Sebutkan hal yang bikin takut!', jawab: ['hantu', 'ketinggian', 'gelap', 'ular', 'kegagalan', 'petir'] },
  { q: 'Sebutkan benda yang ada di kamar mandi!', jawab: ['sabun', 'sikat gigi', 'shampoo', 'handuk', 'ember', 'gayung'] },
  { q: 'Sebutkan olahraga air!', jawab: ['renang', 'selancar', 'menyelam', 'dayung', 'polo air', 'ski air'] },
  { q: 'Sebutkan sesuatu yang ada di langit!', jawab: ['matahari', 'bulan', 'bintang', 'awan', 'pelangi', 'pesawat'] },
  { q: 'Sebutkan hewan berkaki empat!', jawab: ['kucing', 'anjing', 'kuda', 'sapi', 'kambing', 'gajah'] },
];

module.exports = {
  name: 'family100',
  category: 'game', startsGame: true,
  aliases: ['family', 'survey'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, gameState, setGameTimeout, random } = ctx;
    const d = random(DATA);
    // multi: true -> tiap jawaban direbut satu per satu (lihat lib/game-engine.js)
    const game = { game: 'family100', q: d.q, jawab: d.jawab, multi: true, found: {}, sender };
    gameState[from] = game;
    setGameTimeout(from, async () => {
      const lines = game.jawab.map((answer, index) => {
        const finder = game.found[index];
        return finder ? `✅ ${index + 1}. *${answer}* — @${finder.split('@')[0]}` : `❌ ${index + 1}. *${answer}*`;
      });
      await sock.sendMessage(from, {
        text: `⏰ *WAKTU HABIS!*\n\n${d.q}\n\n${lines.join('\n')}`,
        mentions: Object.values(game.found),
      });
    });
    await sock.sendMessage(from, {
      text: `👨‍👩‍👧‍👦 *FAMILY 100*\n\n${d.q}\n\nAda *${d.jawab.length} jawaban* yang benar!\n\n💬 *Rebutan! Ketik satu jawaban per pesan, siapa cepat dia dapat!*\n🏳️ Pemilik soal ketik *nyerah* untuk skip\n\n⏱️ ${ctx.gameDurationText || '2 menit'} | tiap jawaban +1 Point, +Rp 250 · bonus penutup +2 Point, +Rp 500`,
    });
  },
};
