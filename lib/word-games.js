// Data & pembuat plugin untuk game tebakan baru (susunkata, tekateki, tebaklirik, tebakkalimat).
// Semuanya memakai gameState → otomatis dapat respon jawaban salah, hint, dan rebutan dari game-engine.
const { REWARDS } = require('./game-engine');

const SUSUN_KATA = [
  'komputer', 'sepeda', 'jendela', 'pelangi', 'kambing', 'semangka', 'perpustakaan', 'televisi', 'gunung', 'samudra',
  'kupu-kupu', 'matahari', 'bintang', 'sekolah', 'pesawat', 'harimau', 'jerapah', 'rambutan', 'durian', 'kacamata',
  'payung', 'bendera', 'merdeka', 'kalender', 'mangga', 'pisang', 'kelinci', 'lemari', 'boneka', 'stasiun',
  'kereta', 'gitar', 'piring', 'sendok', 'garpu', 'cermin', 'telepon', 'sepatu', 'kaktus', 'anggrek',
];

const TEKA_TEKI = [
  { soal: 'Makin diisi makin ringan. Apakah itu?', jawab: 'balon' },
  { soal: 'Punya kaki tapi tidak bisa berjalan. Apakah itu?', jawab: 'meja' },
  { soal: 'Punya gigi tapi tidak bisa menggigit. Apakah itu?', jawab: 'sisir' },
  { soal: 'Kalau dipotong malah makin tinggi. Apakah itu?', jawab: 'celana' },
  { soal: 'Punya leher tapi tidak punya kepala. Apakah itu?', jawab: 'botol' },
  { soal: 'Selalu datang tapi tidak pernah tiba. Apakah itu?', jawab: 'besok' },
  { soal: 'Punya banyak kunci tapi tidak bisa membuka pintu. Apakah itu?', jawab: 'piano' },
  { soal: 'Makin dikeringkan makin basah. Apakah itu?', jawab: 'handuk' },
  { soal: 'Punya mata tapi tidak bisa melihat. Apakah itu?', jawab: 'jarum' },
  { soal: 'Bisa pecah walau tidak pernah dipegang. Apakah itu?', jawab: 'janji' },
  { soal: 'Punya sayap tapi bukan burung, terbang membawa ratusan orang. Apakah itu?', jawab: 'pesawat' },
  { soal: 'Hitam kalau dibeli, merah saat dipakai, abu-abu saat dibuang. Apakah itu?', jawab: 'arang' },
  { soal: 'Punya kepala dan ekor tapi tidak punya badan. Apakah itu?', jawab: 'koin' },
  { soal: 'Selalu mengikutimu ke mana pun saat ada cahaya. Apakah itu?', jawab: 'bayangan' },
  { soal: 'Punya kota tapi tidak ada rumah, punya laut tapi tidak ada air. Apakah itu?', jawab: 'peta' },
  { soal: 'Bisa berlari tapi tidak punya kaki. Apakah itu?', jawab: 'air' },
  { soal: 'Jika disebut namanya, ia langsung hilang. Apakah itu?', jawab: 'sunyi' },
  { soal: 'Semakin banyak diambil, semakin besar jadinya. Apakah itu?', jawab: 'lubang' },
  { soal: 'Punya lidah tapi tidak bisa bicara, dipakai di kaki. Apakah itu?', jawab: 'sepatu' },
  { soal: 'Naik terus tidak pernah turun. Apakah itu?', jawab: 'umur' },
  { soal: 'Punya jarum tapi tidak bisa menjahit. Apakah itu?', jawab: 'jam' },
  { soal: 'Pagi berkaki empat, siang berkaki dua, sore berkaki tiga. Siapakah itu?', jawab: 'manusia' },
  { soal: 'Dibuang saat dibutuhkan, diambil lagi saat tidak dibutuhkan. Apakah itu?', jawab: 'jangkar' },
  { soal: 'Bisa dipegang tangan kiri, tapi tidak bisa dipegang tangan kanan. Apakah itu?', jawab: 'siku kanan' },
  { soal: 'Punya halaman tapi bukan rumah. Apakah itu?', jawab: 'buku' },
];

// Potongan lagu anak & lagu nasional/daerah populer (isi kata yang hilang).
const TEBAK_LIRIK = [
  { soal: 'Balonku ada lima, rupa-rupa ___', jawab: 'warnanya', lagu: 'Balonku' },
  { soal: 'Pelangi-pelangi alangkah ___ mu', jawab: 'indah', lagu: 'Pelangi' },
  { soal: 'Bintang kecil di langit yang ___', jawab: 'biru', lagu: 'Bintang Kecil' },
  { soal: 'Naik kereta api tut tut tut, siapa hendak ___', jawab: 'turut', lagu: 'Naik Kereta Api' },
  { soal: 'Cicak-cicak di dinding, diam-diam ___', jawab: 'merayap', lagu: 'Cicak di Dinding' },
  { soal: 'Lihat kebunku penuh dengan ___', jawab: 'bunga', lagu: 'Lihat Kebunku' },
  { soal: 'Kasih ibu kepada beta, tak terhingga sepanjang ___', jawab: 'masa', lagu: 'Kasih Ibu' },
  { soal: 'Burung kakak tua hinggap di ___', jawab: 'jendela', lagu: 'Burung Kakak Tua' },
  { soal: 'Topi saya ___, bundar topi saya', jawab: 'bundar', lagu: 'Topi Saya Bundar' },
  { soal: 'Potong bebek angsa, masak di ___', jawab: 'kuali', lagu: 'Potong Bebek Angsa' },
  { soal: 'Ambilkan bulan, Bu, ambilkan bulan, Bu, yang selalu ___', jawab: 'bersinar', lagu: 'Ambilkan Bulan Bu' },
  { soal: 'Satu-satu aku sayang ___', jawab: 'ibu', lagu: 'Satu-Satu Aku Sayang Ibu' },
  { soal: 'Naik-naik ke puncak gunung, tinggi-tinggi ___', jawab: 'sekali', lagu: 'Naik-Naik ke Puncak Gunung' },
  { soal: 'Halo-halo Bandung, ibu kota ___', jawab: 'periangan', lagu: 'Halo-Halo Bandung' },
  { soal: 'Garuda Pancasila, akulah ___', jawab: 'pendukungmu', lagu: 'Garuda Pancasila' },
  { soal: 'Tujuh belas Agustus tahun empat ___', jawab: 'lima', lagu: 'Hari Merdeka' },
  { soal: 'Tanah airku tidak kulupakan, kan terkenang selama ___', jawab: 'hidupku', lagu: 'Tanah Airku' },
  { soal: 'Gundul-gundul ___, cul gembelengan', jawab: 'pacul', lagu: 'Gundul-Gundul Pacul' },
  { soal: 'Ampar-ampar ___, pisangku balum masak', jawab: 'pisang', lagu: 'Ampar-Ampar Pisang' },
  { soal: 'Rasa sayange, rasa sayang ___', jawab: 'sayange', lagu: 'Rasa Sayange' },
  { soal: 'Kring kring kring, ada ___', jawab: 'sepeda', lagu: 'Kring Kring Ada Sepeda' },
  { soal: 'Desaku yang kucinta, pujaan hati ___', jawab: 'hamba', lagu: 'Desaku' },
  { soal: 'Bangun tidur ku terus ___', jawab: 'mandi', lagu: 'Bangun Tidur' },
  { soal: 'Indonesia tanah airku, tanah tumpah ___', jawab: 'darahku', lagu: 'Indonesia Raya' },
  { soal: 'Dari Sabang sampai ___, berjajar pulau-pulau', jawab: 'merauke', lagu: 'Dari Sabang Sampai Merauke' },
];

// Kalimat terkenal (semboyan, Pancasila, Sumpah Pemuda, ungkapan) — isi kata yang hilang.
const TEBAK_KALIMAT = [
  { soal: 'Bhinneka Tunggal ___', jawab: 'ika' },
  { soal: 'Ketuhanan Yang Maha ___', jawab: 'esa' },
  { soal: 'Kemanusiaan yang adil dan ___', jawab: 'beradab' },
  { soal: 'Persatuan ___', jawab: 'indonesia' },
  { soal: 'Keadilan sosial bagi seluruh rakyat ___', jawab: 'indonesia' },
  { soal: 'Kami putra dan putri Indonesia mengaku bertumpah darah yang satu, tanah air ___', jawab: 'indonesia' },
  { soal: 'Tut Wuri ___', jawab: 'handayani' },
  { soal: 'Ing ngarsa sung ___', jawab: 'tuladha' },
  { soal: 'Jalesveva ___', jawab: 'jayamahe' },
  { soal: 'Swa Bhuwana ___', jawab: 'paksa' },
  { soal: 'Kartika Eka ___', jawab: 'paksi' },
  { soal: 'Rastra Sewakottama adalah semboyan ___', jawab: 'polri' },
  { soal: 'Jas Merah: jangan sekali-kali meninggalkan ___', jawab: 'sejarah' },
  { soal: 'Habis gelap terbitlah ___', jawab: 'terang' },
  { soal: 'Gantungkan cita-citamu setinggi ___', jawab: 'langit' },
  { soal: 'Buku adalah jendela ___', jawab: 'dunia' },
  { soal: 'Kebersihan sebagian dari ___', jawab: 'iman' },
  { soal: 'Waktu adalah ___', jawab: 'uang' },
  { soal: 'Mens sana in corpore ___', jawab: 'sano' },
  { soal: 'Bersatu kita teguh, bercerai kita ___', jawab: 'runtuh' },
  { soal: 'Di mana bumi dipijak, di situ langit ___', jawab: 'dijunjung' },
  { soal: 'Tuntutlah ilmu walau sampai ke negeri ___', jawab: 'cina' },
  { soal: 'Hemat pangkal kaya, rajin pangkal ___', jawab: 'pandai' },
  { soal: 'Mangan ora mangan sing penting ___', jawab: 'kumpul' },
  { soal: 'Alon-alon asal ___', jawab: 'kelakon' },
];

function scramble(word, rand = Math.random) {
  const letters = [...word.replace(/[^a-z]/gi, '')];
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    if (letters.join('') !== word.replace(/[^a-z]/gi, '')) break;
  }
  return letters.join(' ').toUpperCase();
}

function rewardText(name) {
  const [point, money] = REWARDS[name] || [3, 500];
  return `+${point} Point, +Rp ${money.toLocaleString('id-ID')}`;
}

function guessGamePlugin({ name, aliases = [], title, build }) {
  return {
    name,
    category: 'game',
    aliases,
    startsGame: true,
    async execute(sock, msg, args, ctx) {
      const { from, sender, gameState, setGameTimeout } = ctx;
      const round = build();
      gameState[from] = { game: name, jawab: round.jawab, sender };
      setGameTimeout(from, async () => {
        await sock.sendMessage(from, { text: `⏰ *WAKTU HABIS!*\n\nJawaban: *${round.jawab}*${round.extra ? `\n${round.extra}` : ''}` });
      });
      await sock.sendMessage(from, {
        text: `${title}\n\n${round.question}\n\n💬 *Ketik jawabanmu langsung di chat!*\n🏳️ Ketik *nyerah* untuk skip\n\n⏱️ ${ctx.gameDurationText || '2 menit'} | ${rewardText(name)}`,
      });
    },
  };
}

const pick = list => list[Math.floor(Math.random() * list.length)];

const PLUGINS = {
  susunkata: () => guessGamePlugin({
    name: 'susunkata', aliases: ['susun', 'acakkata'], title: '🔤 *SUSUN KATA*',
    build: () => {
      const word = pick(SUSUN_KATA);
      return { jawab: word, question: `Susun huruf berikut menjadi kata yang benar:\n\n*${scramble(word)}*\n\n(${word.replace(/[^a-z]/gi, '').length} huruf)` };
    },
  }),
  tekateki: () => guessGamePlugin({
    name: 'tekateki', aliases: ['tekiteki', 'riddle'], title: '🧩 *TEKA-TEKI*',
    build: () => { const item = pick(TEKA_TEKI); return { jawab: item.jawab, question: `❓ ${item.soal}` }; },
  }),
  tebaklirik: () => guessGamePlugin({
    name: 'tebaklirik', aliases: ['lirik', 'lengkapilirik'], title: '🎵 *TEBAK LIRIK*',
    build: () => {
      const item = pick(TEBAK_LIRIK);
      return { jawab: item.jawab, question: `Lengkapi lirik lagu berikut:\n\n🎶 _${item.soal}_`, extra: `🎵 Lagu: ${item.lagu}` };
    },
  }),
  tebakkalimat: () => guessGamePlugin({
    name: 'tebakkalimat', aliases: ['lengkapisemboyan', 'tkalimat'], title: '📜 *TEBAK KALIMAT*',
    build: () => { const item = pick(TEBAK_KALIMAT); return { jawab: item.jawab, question: `Lengkapi kalimat terkenal berikut:\n\n📝 _${item.soal}_` }; },
  }),
};

module.exports = { SUSUN_KATA, TEKA_TEKI, TEBAK_LIRIK, TEBAK_KALIMAT, scramble, guessGamePlugin, PLUGINS };
