const crypto = require('node:crypto');

// Khodam "hiburan" — murni lucu-lucuan, bukan ramalan sungguhan.
const KHODAM = [
  ['Macan Putih Pensiunan', 'Auranya kalem, tapi sekali mengaum satu RT diam.'],
  ['Naga Api Hemat Energi', 'Menyemburkan api hanya kalau token listrik masih ada.'],
  ['Kulkas Dua Pintu', 'Dingin, luas, dan selalu menyimpan rahasia isi dapur.'],
  ['Sendal Jepit Swallow', 'Tahan banting, sudah melewati ribuan kondangan.'],
  ['Kucing Oren Penjaga Warung', 'Pura-pura tidur, padahal mengawasi semua gorengan.'],
  ['Burung Hantu Begadang', 'Paling melek jam 2 pagi, paling ngantuk jam 2 siang.'],
  ['Kuda Lumping Wi-Fi', 'Lari kencang kalau sinyal penuh, ngambek kalau hujan.'],
  ['Harimau Sumatra Berdasi', 'Berwibawa di rapat, buas di diskon akhir bulan.'],
  ['Ayam Jago Alarm Subuh', 'Bangun lebih awal dari semua orang, termasuk matahari.'],
  ['Kodok Sakti Sawah Wetan', 'Kalau dia bunyi, hujan datang. Kadang cuma mendung.'],
  ['Elang Jawa Tanpa Sinyal', 'Pandangannya tajam, tapi tetap salah belok di Google Maps.'],
  ['Gajah Putih Penjaga Dompet', 'Dompet tebal sulit ditembus, apalagi tanggal tua.'],
  ['Kura-kura Ninja Lemot', 'Pelan tapi pasti, selalu sampai tepat setelah acara selesai.'],
  ['Ular Kobra Kasir Indomaret', 'Sekali tanya "ada kartu member?", semua orang gemetar.'],
  ['Singa Laut Rebahan', 'Hobi berjemur dan menolak ajakan olahraga.'],
  ['Kambing Gunung Anti Macet', 'Tangkas menyalip lewat gang tikus mana pun.'],
  ['Rubah Ekor Sembilan Diskon', 'Jago mencari promo, voucher, dan cashback tersembunyi.'],
  ['Banteng Ketaton Lembur', 'Kuat menanggung deadline, lemah menahan godaan rebahan.'],
  ['Panda Raksasa Tukang Makan', 'Tenang, menggemaskan, dan tidak pernah menolak makanan gratis.'],
  ['Merpati Pos Balas Chat Besok', 'Pesan pasti sampai, balasannya menyusul tiga hari lagi.'],
  ['Bebek Karet Pembawa Hoki', 'Kalau ada masalah, dia cuma bilang: kwek.'],
  ['Kelinci Turbo Bulan Purnama', 'Lompatannya jauh, dan selalu terlambat satu menit.'],
  ['Buaya Darat Bersertifikat', 'Mulutnya manis, janjinya... ya begitulah.'],
  ['Pocong Tukang Parkir', 'Muncul tiba-tiba dan bilang "kiri terus, kiri terus".'],
  ['Genderuwo Admin Grup', 'Jarang muncul, tapi sekali muncul semua anggota sungkan.'],
  ['Tuyul Auto Hemat', 'Tidak mencuri, cuma menagih utang dengan sopan.'],
  ['Kuntilanak Reminder Cicilan', 'Tawanya khas, selalu muncul tepat tanggal jatuh tempo.'],
  ['Jin Botol Es Teh Manis', 'Mengabulkan satu permintaan: tambah gula sedikit.'],
  ['Dewa Rebahan Level Maksimal', 'Satu kasur, seribu rencana, nol eksekusi.'],
  ['Pangeran Mi Instan Telur Setengah Matang', 'Penyelamat akhir bulan sejak zaman kos-kosan.'],
  ['Ratu Pantai Selatan Versi Hemat', 'Cantik berwibawa, tapi lebih suka healing murah meriah.'],
  ['Satria Baja Hitam Charger', 'Kuat selama baterai di atas 20 persen.'],
  ['Naga Bonar Kopi Susu', 'Gaya sangar, tapi luluh kalau ditawari kopi.'],
  ['Cicak Penunggu Dinding', 'Diam-diam menyimak semua obrolan, lalu jatuh di waktu yang tidak tepat.'],
  ['Kecoa Terbang Anti Peluru', 'Ditakuti semua orang, diburu sandal, tetap abadi.'],
  ['Paus Biru Sultan Paket Data', 'Kuota selalu lega, tapi sinyal tetap kedip-kedip.'],
  ['Semut Rangrang Penjaga Gula', 'Kecil tapi kompak, tidak pernah gagal menemukan manisan.'],
  ['Kerbau Bule Penarik Becak', 'Tenang, sabar, dan kuat menarik beban hidup.'],
  ['Phoenix Reborn Skripsi', 'Revisi ke-17 pun tetap bangkit dari abu.'],
  ['Serigala Malam Lapar', 'Aktif tengah malam, targetnya kulkas.'],
  ['Kupu-kupu Sakti Mandraguna', 'Sayapnya lembut, tapi efeknya bisa bikin badai di tempat lain.'],
  ['Beruang Madu Tukang Tidur', 'Hibernasi dimulai sejak Senin pagi.'],
  ['Hiu Martil Penagih Utang', 'Langkahnya mantap, ingatannya tajam soal nominal.'],
  ['Lumba-lumba Cerdas Kuis Malam', 'Tebakannya jitu, hadiahnya selalu cuma stiker.'],
  ['Monyet Jenaka Pembuat Meme', 'Selalu punya bahan receh di setiap situasi.'],
  ['Landak Duri Seribu Tapi Baik Hati', 'Terlihat galak, aslinya lembut kalau sudah kenal.'],
  ['Komodo Pelari Mager', 'Sprint hanya saat ada yang bagi makanan.'],
  ['Kelelawar Penerbang Sore', 'Mulai aktif pas orang lain mulai pulang.'],
  ['Naga Emas Gaji UMR', 'Berkilau di tanggal 1, menghilang di tanggal 5.'],
  ['Orang Utan Pencari Sinyal', 'Naik pohon tertinggi hanya demi satu bar sinyal.'],
];

const KEKUATAN = ['Kebal Macet', 'Tidur Kilat', 'Sabar Level Dewa', 'Nyari Diskon', 'Antiremuk', 'Balas Chat Cepat', 'Hemat Kuota', 'Kebal Mantan', 'Mager Pro', 'Senyum Mematikan'];

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function pickFor(name) {
  const hash = crypto.createHash('sha256').update(`${name.toLowerCase()}|${todayKey()}`).digest();
  const [khodam, desc] = KHODAM[hash.readUInt16BE(0) % KHODAM.length];
  const power = hash.readUInt8(2) % 51 + 50; // 50-100
  const skill = KEKUATAN[hash.readUInt8(3) % KEKUATAN.length];
  return { khodam, desc, power, skill };
}

module.exports = {
  name: 'cekkhodam',
  category: 'fun',
  aliases: ['khodam', 'cekkodam', 'kodam'],
  KHODAM,
  pickFor,
  async execute(sock, msg, args, ctx) {
    const { from, mentioned, pushName } = ctx;
    const target = (mentioned && mentioned[0]) || null;
    const name = target ? target.split('@')[0] : (args.join(' ').trim() || pushName || 'Kamu');
    if (name.length > 40) {
      return sock.sendMessage(from, { text: 'Nama maksimal 40 karakter.' }, { quoted: msg });
    }

    const { khodam, desc, power, skill } = pickFor(name);
    const filled = Math.round(power / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    await sock.sendMessage(from, {
      text: `🔮 *CEK KHODAM*\n\n` +
        `👤 Nama    : *${target ? '@' + name : name}*\n` +
        `👻 Khodam  : *${khodam}*\n` +
        `⚡ Kekuatan: *${skill}*\n` +
        `📊 Energi  : *${power}%*\n[${bar}]\n\n` +
        `_${desc}_\n\n` +
        `_Hasil berganti tiap hari. Hanya hiburan, jangan dianggap serius ya!_`,
      mentions: target ? [target] : [],
    }, { quoted: msg });
  },
};
