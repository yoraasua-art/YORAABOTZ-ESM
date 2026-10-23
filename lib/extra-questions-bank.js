/**
 * ============================================================================
 * MEGA QUESTION BANK EXPANSION (TAMBAHAN SOAL UNTUK SEMUA GAME & KUIS)
 * ============================================================================
 * Berisi ratusan soal baru yang disuntikkan otomatis ke dalam game:
 * asahotak, caklontong, siapakahaku, tekateki, susunkata, tebakkata,
 * tebakkalimat, tebaklirik, lengkapikalimat, tebakhewan, tebakibukota,
 * tebakanime, tebakbendera, tebakfilm, tebakpemainbola, tebakplanet,
 * tebakpresiden, family100, dan quiz!
 */

const EXTRA_QUESTIONS = {
  asahotak: [
    { soal: 'Benda apa yang semakin dipotong malah semakin tinggi?', jawaban: 'Celana panjang' },
    { soal: 'Sungai terpanjang di pulau Kalimantan dan di Indonesia adalah?', jawaban: 'Sungai Kapuas' },
    { soal: 'Gas apa yang paling banyak menyusun atmosfer Bumi (sekitar 78%)?', jawaban: 'Nitrogen' },
    { soal: 'Alat optik yang digunakan pada kapal selam untuk melihat permukaan laut?', jawaban: 'Periskop' },
    { soal: 'Logam cair pada suhu ruang yang biasa mengisi termometer tradisional?', jawaban: 'Raksa' },
    { soal: 'Candi Buddha terbesar di dunia yang terletak di Magelang, Jawa Tengah?', jawaban: 'Borobudur' },
    { soal: 'Benua terluas di permukaan Bumi adalah benua?', jawaban: 'Asia' },
    { soal: 'Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh?', jawaban: 'Jantung' },
    { soal: 'Satuan internasional untuk mengukur kuat arus listrik adalah?', jawaban: 'Ampere' },
    { soal: 'Selat yang memisahkan Pulau Jawa dan Pulau Sumatera adalah?', jawaban: 'Selat Sunda' },
    { soal: 'Vitamin yang diproduksi tubuh saat kulit terkena sinar matahari pagi?', jawaban: 'Vitamin D' },
    { soal: 'Penemu bola lampu pijar modern yang terkenal di dunia?', jawaban: 'Thomas Alva Edison' }
  ],
  caklontong: [
    { soal: 'Orang yang memimpin jalannya kereta api disebut?', jawaban: 'Masinis', alasan: 'Kalau sopir adanya di mobil atau bus!' },
    { soal: 'Sebelum dimakan, pisang biasanya harus di...', jawaban: 'Kupas', alasan: 'Masa mau dimakan sama kulit-kulitnya?' },
    { soal: 'Benda yang dipakai di kepala saat naik motor agar aman?', jawaban: 'Helm', alasan: 'Kalau panci dipakai di dapur buat masak.' },
    { soal: 'Supaya bersih, kita mandi menggunakan sabun dan...', jawaban: 'Air', alasan: 'Kalau sabun doang tanpa air malah lengket!' },
    { soal: 'Ayam berkokok pada pagi hari, kalau malam hari ayam...', jawaban: 'Tidur', alasan: 'Ayam juga butuh istirahat malam-malam.' },
    { soal: 'Tempat berhenti pesawat terbang untuk menurunkan penumpang disebut?', jawaban: 'Bandara', alasan: 'Kalau terminal tempat berhentinya angkot dan bus.' },
    { soal: 'Ketika hujan turun biasanya langit terlihat...', jawaban: 'Mendung', alasan: 'Kalau cerah namanya bukan mendung mau hujan.' },
    { soal: 'Orang yang bekerja menyembuhkan pasien di rumah sakit adalah?', jawaban: 'Dokter', alasan: 'Sudah jelas tugasnya memeriksa pasien.' },
    { soal: 'Kita melihat menggunakan mata, kalau mendengar menggunakan?', jawaban: 'Telinga', alasan: 'Masa mendengar pakai hidung?' },
    { soal: 'Sepak bola dimainkan oleh sebelas orang di atas?', jawaban: 'Lapangan', alasan: 'Kalau di atas genteng nanti bolanya jatuh terus.' }
  ],
  siapakahaku: [
    { soal: 'Aku punya leher tapi tidak punya kepala. Aku punya dua lengan tapi tidak punya tangan. Aku selalu dipakai manusia. Siapakah aku?', jawaban: 'Baju' },
    { soal: 'Aku punya banyak gigi tapi tidak bisa menggigit. Aku sering merapikan rambutmu. Siapakah aku?', jawaban: 'Sisir' },
    { soal: 'Aku selalu berjalan dan berdetak setiap detik, tapi tidak pernah berpindah tempat. Siapakah aku?', jawaban: 'Jam dinding' },
    { soal: 'Tubuhku panjang, saat bekerja aku dibakar dan semakin pendek sambil mengeluarkan cahaya. Siapakah aku?', jawaban: 'Lilin' },
    { soal: 'Aku punya mata banyak di kulitku, warnaku kuning, dan punya mahkota di atas kepala. Siapakah aku?', jawaban: 'Nanas' },
    { soal: 'Aku penuh dengan lubang, tapi tetap bisa menyimpan banyak air di dalam tubuhku. Siapakah aku?', jawaban: 'Spons' },
    { soal: 'Aku selalu mengikuti ke mana pun kamu pergi saat ada cahaya, tapi hilang saat gelap. Siapakah aku?', jawaban: 'Bayangan' },
    { soal: 'Aku bulat dan ditendang oleh 22 orang di lapangan hijau. Siapakah aku?', jawaban: 'Bola' },
    { soal: 'Aku dipakai saat hujan turun, bentukku seperti jamur saat dibuka. Siapakah aku?', jawaban: 'Payung' },
    { soal: 'Aku menyimpan banyak ilmu pengetahuan, punya banyak halaman tapi tidak bisa bicara. Siapakah aku?', jawaban: 'Buku' }
  ],
  tekateki: [
    { soal: 'Apa yang bisa naik ke atas tetapi tidak pernah bisa turun kembali?', jawaban: 'Umur' },
    { soal: 'Bulan apa dalam kalender yang memiliki 28 hari?', jawaban: 'Semua bulan' },
    { soal: 'Benda apa yang kalau dipecahkan baru bisa digunakan untuk memasak?', jawaban: 'Telur' },
    { soal: 'Makin banyak kamu mengambilnya, makin besar ukurannya yang tertinggal. Apakah itu?', jawaban: 'Lubang' },
    { soal: 'Punya kota tanpa rumah, punya hutan tanpa pohon, dan punya sungai tanpa air. Apakah itu?', jawaban: 'Peta' },
    { soal: 'Benda apa yang basah kuyup saat sedang mengeringkan sesuatu?', jawaban: 'Handuk' },
    { soal: 'Memiliki empat kaki di pagi hari, dua kaki di siang hari, dan tiga kaki di sore hari?', jawaban: 'Manusia' },
    { soal: 'Selalu datang di masa depan tetapi tidak pernah benar-benar tiba hari ini?', jawaban: 'Besok' },
    { soal: 'Bisa dipegang oleh tangan kiri, tapi tidak mungkin dipegang oleh tangan kananmu sendiri?', jawaban: 'Siku kanan' },
    { soal: 'Apa yang memiliki satu mata tetapi sama sekali tidak bisa melihat?', jawaban: 'Jarum' }
  ],
  susunkata: [
    { soal: 'A - K - T - U - L - I - S - T - I - W - A (Garis tengah bumi)', jawaban: 'Khatulistiwa', acak: 'W A T I S I L U T A H K' },
    { soal: 'I - N - D - O - N - E - S - I - A (Negara kepulauan)', jawaban: 'Indonesia', acak: 'S I N A D O N E I' },
    { soal: 'M - A - T - A - H - A - R - I (Pusat tata surya)', jawaban: 'Matahari', acak: 'R I H A T A M A' },
    { soal: 'K - O - M - P - U - T - E - R (Alat elektronik pengolah data)', jawaban: 'Komputer', acak: 'R E T U P M O K' },
    { soal: 'P - E - R - P - U - S - T - A - K - A - A - N (Tempat membaca buku)', jawaban: 'Perpustakaan', acak: 'N A A K A T S U P R E P' },
    { soal: 'F - O - T - O - S - I - N - T - E - S - I - S (Proses tumbuhan memasak makanan)', jawaban: 'Fotosintesis', acak: 'S I S E T N I S O T O F' },
    { soal: 'T - E - L - E - V - I - S - I (Media penyiaran gambar dan suara)', jawaban: 'Televisi', acak: 'I S I V E L E T' },
    { soal: 'K - E - M - E - R - D - E - K - A - A - N (Kebebasan suatu bangsa)', jawaban: 'Kemerdekaan', acak: 'N A A K E D R E M E K' }
  ],
  tebakkata: [
    { soal: 'Alat transportasi udara yang memiliki baling-baling di bagian atasnya', jawaban: 'Helikopter' },
    { soal: 'Hewan mamalia laut cerdas yang bernapas dengan paru-paru dan suka melompat', jawaban: 'Lumba-lumba' },
    { soal: 'Benda langit yang memancarkan cahayanya sendiri di malam hari', jawaban: 'Bintang' },
    { soal: 'Profesi seseorang yang merancang bangunan dan gedung', jawaban: 'Arsitek' },
    { soal: 'Alat untuk mengukur suhu panas atau dingin suatu benda/tubuh', jawaban: 'Termometer' },
    { soal: 'Gunung tertinggi di dunia yang terletak di pegunungan Himalaya', jawaban: 'Everest' },
    { soal: 'Ibukota provinsi Jawa Timur yang dijuluki Kota Pahlawan', jawaban: 'Surabaya' },
    { soal: 'Alat musik tradisional dari Jawa Barat yang terbuat dari bambu', jawaban: 'Angklung' }
  ],
  tebakkalimat: [
    { soal: 'Air beriak tanda tak ...', jawaban: 'Dalam' },
    { soal: 'Bagai pinang dibelah ...', jawaban: 'Dua' },
    { soal: 'Sedikit demi sedikit lama-lama menjadi ...', jawaban: 'Bukit' },
    { soal: 'Di mana bumi dipijak, di situ langit ...', jawaban: 'Dijunjung' },
    { soal: 'Sepandai-pandai tupai melompat, akhirnya jatuh ...', jawaban: 'Juga' },
    { soal: 'Berakit-rakit ke hulu, berenang-renang ke ...', jawaban: 'Tepian' },
    { soal: 'Tong kosong nyaring ...', jawaban: 'Bunyinya' },
    { soal: 'Ada udang di balik ...', jawaban: 'Batu' }
  ],
  lengkapikalimat: [
    { soal: 'Rajin pangkal pandai, hemat pangkal ...', jawaban: 'Kaya' },
    { soal: 'Besar pasak daripada ...', jawaban: 'Tiang' },
    { soal: 'Sambil menyelam minum ...', jawaban: 'Air' },
    { soal: 'Sekali merengkuh dayung, dua tiga pulau ...', jawaban: 'Terlampaui' },
    { soal: 'Karena nila setitik, rusak susu ...', jawaban: 'Sebelanga' },
    { soal: 'Tak ada rotan, akar pun ...', jawaban: 'Jadi' },
    { soal: 'Bagai air di daun ...', jawaban: 'Talas' },
    { soal: 'Cepat kaki ringan ...', jawaban: 'Tangan' }
  ],
  tebaklirik: [
    { soal: 'Pelangi-pelangi alangkah indahmu, merah kuning hijau di langit yang ...', jawaban: 'Biru' },
    { soal: 'Balonku ada lima, rupa-rupa warnanya, hijau kuning kelabu, merah muda dan ...', jawaban: 'Biru' },
    { soal: 'Indonesia tanah airku, tanah tumpah ...', jawaban: 'Darahku' },
    { soal: 'Garuda Pancasila, akulah ...', jawaban: 'Pendukungmu' },
    { soal: 'Bintang kecil di langit yang biru, amat banyak menghias ...', jawaban: 'Angkasa' },
    { soal: 'Naik-naik ke puncak gunung, tinggi-tinggi ...', jawaban: 'Sekali' }
  ],
  tebakhewan: [
    { soal: 'Hewan darat tertinggi di dunia dengan leher yang sangat panjang?', jawaban: 'Jerapah' },
    { soal: 'Hewan khas pulau Komodo di Nusa Tenggara Timur yang merupakan kadal raksasa?', jawaban: 'Komodo' },
    { soal: 'Hewan darat tercepat di dunia yang mampu berlari hingga 110 km/jam?', jawaban: 'Cheetah' },
    { soal: 'Burung yang tidak bisa terbang tapi sangat pandai berenang di kutub selatan?', jawaban: 'Penguin' },
    { soal: 'Hewan pemakan bambu berwarna hitam putih yang berasal dari Tiongkok?', jawaban: 'Panda' },
    { soal: 'Hewan reptil yang mampu mengubah warna kulitnya sesuai lingkungan sekitar?', jawaban: 'Bunglon' },
    { soal: 'Hewan berkantung khas Australia yang bergerak dengan cara melompat?', jawaban: 'Kanguru' },
    { soal: 'Hewan mamalia terbesar di bumi yang hidup di lautan lepas?', jawaban: 'Paus biru' }
  ],
  tebakibukota: [
    { soal: 'Apa nama ibukota negara Jepang?', jawaban: 'Tokyo' },
    { soal: 'Apa nama ibukota negara Korea Selatan?', jawaban: 'Seoul' },
    { soal: 'Apa nama ibukota negara Inggris (Britania Raya)?', jawaban: 'London' },
    { soal: 'Apa nama ibukota negara Prancis?', jawaban: 'Paris' },
    { soal: 'Apa nama ibukota negara Arab Saudi?', jawaban: 'Riyadh' },
    { soal: 'Apa nama ibukota negara Turki?', jawaban: 'Ankara' },
    { soal: 'Apa nama ibukota negara Thailand?', jawaban: 'Bangkok' },
    { soal: 'Apa nama ibukota negara Malaysia?', jawaban: 'Kuala Lumpur' },
    { soal: 'Apa nama ibukota negara Jerman?', jawaban: 'Berlin' },
    { soal: 'Apa nama ibukota negara Mesir?', jawaban: 'Kairo' }
  ],
  tebakanime: [
    { soal: 'Siapakah tokoh utama anime yang bercita-cita menjadi Hokage di desa Konoha?', jawaban: 'Naruto Uzumaki' },
    { soal: 'Siapakah kapten bajak laut Topi Jerami pemakan buah Gomu Gomu no Mi?', jawaban: 'Monkey D Luffy' },
    { soal: 'Siapakah pembasmi iblis yang membawa adiknya Nezuko di dalam kotak kayu?', jawaban: 'Tanjiro Kamado' },
    { soal: 'Siapakah pahlawan botak berjubah yang bisa mengalahkan musuh dengan satu pukulan?', jawaban: 'Saitama' },
    { soal: 'Siapakah detektif SMA yang tubuhnya mengecil menjadi anak SD bernama Conan?', jawaban: 'Shinichi Kudo' },
    { soal: 'Siapakah penyihir terkuat bermata Six Eyes dan teknik Limitless di Jujutsu Kaisen?', jawaban: 'Satoru Gojo' }
  ],
  tebakpemainbola: [
    { soal: 'Pemain sepak bola Argentina berjuluk La Pulga yang memenangkan Piala Dunia 2022?', jawaban: 'Lionel Messi' },
    { soal: 'Bintang sepak bola Portugal yang identik dengan nomor punggung CR7 dan selebrasi Siuuu?', jawaban: 'Cristiano Ronaldo' },
    { soal: 'Penyerang cepat timnas Prancis yang pernah mencetak hattrick di final Piala Dunia 2022?', jawaban: 'Kylian Mbappe' },
    { soal: 'Striker tajam asal Norwegia yang membela klub Manchester City?', jawaban: 'Erling Haaland' },
    { soal: 'Bintang sepak bola Brasil yang terkenal dengan skill gocekan samba dan pernah bermain di Barcelona & PSG?', jawaban: 'Neymar' },
    { soal: 'Kapten timnas Indonesia yang bermain di lini pertahanan dan berkarier di Eropa (Jay ...)?', jawaban: 'Jay Idzes' }
  ],
  tebakplanet: [
    { soal: 'Planet terbesar di dalam sistem Tata Surya kita adalah?', jawaban: 'Jupiter' },
    { soal: 'Planet yang terkenal memiliki cincin indah yang mengelilinginya?', jawaban: 'Saturnus' },
    { soal: 'Planet terdekat dengan Matahari adalah planet?', jawaban: 'Merkurius' },
    { soal: 'Planet yang dijuluki sebagai Planet Merah adalah?', jawaban: 'Mars' },
    { soal: 'Planet terpanas di Tata Surya yang juga dijuluki Bintang Kejora?', jawaban: 'Venus' },
    { soal: 'Planet urutan kedelapan atau terjauh dari Matahari di Tata Surya?', jawaban: 'Neptunus' }
  ],
  tebakpresiden: [
    { soal: 'Siapakah Presiden pertama Republik Indonesia sekaligus Proklamator Kemerdekaan?', jawaban: 'Soekarno' },
    { soal: 'Siapakah Presiden ke-3 RI yang ahli membuat pesawat terbang (Mr. Crack)?', jawaban: 'BJ Habibie' },
    { soal: 'Siapakah Presiden ke-4 RI yang dikenal sebagai Bapak Pluralisme (Gus Dur)?', jawaban: 'Abdurrahman Wahid' },
    { soal: 'Siapakah Presiden wanita pertama dalam sejarah Republik Indonesia?', jawaban: 'Megawati Soekarnoputri' },
    { soal: 'Siapakah Presiden ke-6 RI yang menjabat selama 2 periode (2004-2014)?', jawaban: 'Susilo Bambang Yudhoyono' },
    { soal: 'Siapakah Presiden ke-8 Republik Indonesia yang dilantik pada tahun 2024?', jawaban: 'Prabowo Subianto' }
  ],
  tebakfilm: [
    { soal: 'Film superhero Marvel tentang berkumpulnya para pahlawan melawan Thanos memperebutkan Infinity Stones?', jawaban: 'Avengers Endgame' },
    { soal: 'Film Indonesia karya Andrea Hirata tentang perjuangan 10 anak di pulau Belitung?', jawaban: 'Laskar Pelangi' },
    { soal: 'Film tentang kapal pesiar mewah raksasa yang menabrak gunung es di Samudra Atlantik?', jawaban: 'Titanic' },
    { soal: 'Film animasi Pixar tentang mainan koboi Woody dan astronot Buzz Lightyear yang bisa hidup?', jawaban: 'Toy Story' },
    { soal: 'Film fiksi ilmiah karya James Cameron tentang bangsa Na vi berkulit biru di planet Pandora?', jawaban: 'Avatar' }
  ],
  tebakbendera: [
    { soal: '🇲🇨 Bendera negara apakah ini (Merah Putih)?', jawaban: 'Indonesia' },
    { soal: '🇯🇵 Bendera negara apakah ini (Putih dengan lingkaran merah di tengah)?', jawaban: 'Jepang' },
    { soal: '🇧🇷 Bendera negara apakah ini (Hijau dengan belah ketupat kuning dan bola biru)?', jawaban: 'Brasil' },
    { soal: '🇰🇷 Bendera negara apakah ini (Putih dengan simbol Yin-Yang biru merah dan 4 trigram)?', jawaban: 'Korea Selatan' },
    { soal: '🇸🇦 Bendera negara apakah ini (Hijau dengan kalimat Syahadat dan pedang putih)?', jawaban: 'Arab Saudi' },
    { soal: '🇵🇸 Bendera negara apakah ini (Segitiga merah dengan garis hitam, putih, hijau)?', jawaban: 'Palestina' }
  ],
  family100: [
    {
      soal: 'Sebutkan benda yang biasanya dibawa orang saat pergi ke sekolah!',
      jawaban: ['tas', 'buku', 'pulpen', 'pensil', 'botol minum', 'kotak makan', 'seragam', 'sepatu']
    },
    {
      soal: 'Sebutkan makanan khas Indonesia yang paling terkenal di dunia!',
      jawaban: ['rendang', 'nasi goreng', 'sate', 'bakso', 'gado gado', 'soto', 'tempe', 'gudeg']
    },
    {
      soal: 'Sebutkan hewan yang sering dipelihara di rumah!',
      jawaban: ['kucing', 'anjing', 'burung', 'ikan', 'hamster', 'kelinci', 'kura kura', 'ayam']
    },
    {
      soal: 'Sebutkan alasan seseorang datang terlambat ke sekolah atau kantor!',
      jawaban: ['macet', 'bangun kesiangan', 'hujan', 'ban bocor', 'mogok', 'sakit', 'lupa']
    }
  ]
};

module.exports = { EXTRA_QUESTIONS };
