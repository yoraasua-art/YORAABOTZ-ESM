// ============================================================
//   Generator SOAL CERITA matematika
//   Jawaban selalu bilangan bulat positif.
// ============================================================

const NAMES = ['Budi', 'Ani', 'Siti', 'Andi', 'Rina', 'Dedi', 'Tono', 'Dewi', 'Fajar', 'Putri', 'Joko', 'Sari', 'Rudi', 'Maya', 'Bayu', 'Lina'];
const ITEMS = ['kelereng', 'permen', 'buku', 'pensil', 'apel', 'jeruk', 'kue', 'stiker', 'balon', 'kartu'];
// [nama barang, harga satuan minimum, harga satuan maksimum]
const SHOP_ITEMS = [
  ['buku tulis', 3000, 8000], ['pulpen', 2000, 6000], ['roti', 2500, 9000],
  ['penghapus', 1000, 4000], ['es teh', 3000, 7000], ['bakso', 8000, 15000],
];
const CROPS = ['padi', 'jagung', 'singkong', 'kentang', 'wortel'];

function makeHelpers(rng) {
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = list => list[Math.floor(rng() * list.length)];
  const twoNames = () => {
    const first = pick(NAMES);
    let second = pick(NAMES);
    while (second === first) second = pick(NAMES);
    return [first, second];
  };
  const rp = n => 'Rp' + n.toLocaleString('id-ID');
  return { int, pick, twoNames, rp };
}

// Setiap template mengembalikan { q, a }.
const LEVELS = {
  mudah: [
    ({ int, pick, twoNames }) => {
      const [n1, n2] = twoNames(); const item = pick(ITEMS);
      const a = int(12, 80); const b = int(10, 60);
      return { a: a + b, q: `${n1} punya ${a} ${item}. Lalu ${n2} memberinya ${b} ${item} lagi. Berapa ${item} ${n1} sekarang?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const item = pick(ITEMS);
      const a = int(40, 150); const b = int(10, a - 10);
      return { a: a - b, q: `${n} membawa ${a} ${item} ke sekolah. Sebanyak ${b} ${item} dibagikan ke teman-temannya. Berapa ${item} yang tersisa?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const item = pick(ITEMS);
      const per = int(6, 24); const boxes = int(3, 15);
      return { a: per * boxes, q: `Satu kotak berisi ${per} ${item}. ${n} membeli ${boxes} kotak. Berapa jumlah seluruh ${item} yang dibeli ${n}?` };
    },
    ({ int, pick }) => {
      const item = pick(ITEMS); const kids = int(3, 12); const each = int(4, 20);
      return { a: each, q: `Bu Guru membagikan ${kids * each} ${item} secara merata kepada ${kids} siswa. Berapa ${item} yang diterima setiap siswa?` };
    },
    ({ int, pick }) => {
      const crop = pick(CROPS); const perDay = int(15, 90); const days = int(3, 12);
      return { a: perDay * days, q: `Pak Tani memanen ${perDay} kg ${crop} setiap hari. Berapa kg ${crop} yang ia panen selama ${days} hari?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const piece = int(2, 9); const count = int(5, 25);
      return { a: count, q: `${n} punya tali sepanjang ${piece * count} meter. Tali itu dipotong-potong, masing-masing ${piece} meter. Berapa potongan tali yang didapat?` };
    },
  ],

  sedang: [
    ({ int, pick }) => {
      const item = pick(ITEMS); const start = int(80, 200); const sold = int(20, 70); const add = int(15, 60);
      return { a: start - sold + add, q: `Di warung Bu Siti ada ${start} ${item}. Pagi hari terjual ${sold} ${item}, lalu siang datang kiriman ${add} ${item}. Berapa ${item} di warung sekarang?` };
    },
    ({ int }) => {
      const start = int(30, 60); const off1 = int(5, 20); const on = int(8, 25); const off2 = int(5, 15);
      return { a: start - off1 + on - off2, q: `Sebuah bus berisi ${start} penumpang. Di halte pertama turun ${off1} orang dan naik ${on} orang. Di halte kedua turun ${off2} orang. Berapa penumpang bus sekarang?` };
    },
    ({ int, pick, rp }) => {
      const n = pick(NAMES); const [item, minPrice, maxPrice] = pick(SHOP_ITEMS);
      const unit = int(minPrice / 500, maxPrice / 500) * 500; const count = int(2, 6);
      const pay = Math.ceil((unit * count + 1) / 10000) * 10000;
      return { a: pay - unit * count, q: `${n} membeli ${count} ${item} dengan harga ${rp(unit)} per buah. Ia membayar dengan uang ${rp(pay)}. Berapa rupiah uang kembaliannya?` };
    },
    ({ int, rp }) => {
      const price = int(4, 15) * 5000; const people = int(3, 9); const discount = int(1, 5) * 5000;
      return { a: price * people - discount, q: `Harga tiket masuk wahana ${rp(price)} per orang. Rombongan berjumlah ${people} orang dan mendapat potongan harga total ${rp(discount)}. Berapa rupiah yang harus dibayar rombongan itu?` };
    },
    ({ int }) => {
      const speed = int(4, 12) * 10; const hours = int(2, 6);
      return { a: speed * hours, q: `Sebuah mobil melaju dengan kecepatan tetap ${speed} km/jam. Berapa km jarak yang ditempuh mobil itu selama ${hours} jam?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const age = int(8, 15); const extra = int(1, 6);
      return { a: age * 3 + extra, q: `Umur ${n} adalah ${age} tahun. Umur ayahnya ${extra} tahun lebih tua dari tiga kali umur ${n}. Berapa tahun umur ayah ${n}?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const quarter = int(3, 20); const total = quarter * 4;
      return { a: total - quarter, q: `${n} punya ${total} kelereng. Seperempat dari kelereng itu diberikan kepada adiknya. Berapa kelereng ${n} yang tersisa?` };
    },
    ({ int }) => {
      const length = int(8, 30); const width = int(4, length - 1);
      return { a: 2 * (length + width), q: `Sebuah kebun berbentuk persegi panjang dengan panjang ${length} meter dan lebar ${width} meter. Pak Dedi ingin memagari seluruh sisi kebun. Berapa meter panjang pagar yang dibutuhkan?` };
    },
    ({ int }) => {
      const length = int(6, 25); const width = int(3, 15);
      return { a: length * width, q: `Lantai kamar berbentuk persegi panjang berukuran ${length} meter × ${width} meter. Berapa meter persegi luas lantai kamar tersebut?` };
    },
    ({ int, pick, rp }) => {
      const n = pick(NAMES); const rate = int(2, 8) * 1000; const hours = int(3, 8);
      return { a: rate * hours, q: `${n} bekerja paruh waktu dengan upah ${rp(rate)} per jam. Jika ia bekerja ${hours} jam, berapa rupiah upah yang ia terima?` };
    },
  ],

  sulit: [
    ({ pick, rp }) => {
      const price = pick([20000, 40000, 60000, 80000, 100000, 120000, 200000]);
      const percent = pick([10, 20, 25, 50]);
      const item = pick(['baju', 'sepatu', 'tas', 'jaket']);
      return { a: price - (price * percent) / 100, q: `Sebuah ${item} berharga ${rp(price)}. Toko memberi diskon ${percent}%. Berapa rupiah yang harus dibayar?` };
    },
    ({ int, pick }) => {
      const n = pick(NAMES); const mean = int(70, 90); const d1 = int(-8, 8); const d2 = int(-8, 8);
      const scores = [mean + d1, mean + d2, mean - d1 - d2];
      return { a: mean, q: `Nilai tiga ulangan ${n} berturut-turut adalah ${scores[0]}, ${scores[1]}, dan ${scores[2]}. Berapa nilai rata-rata ulangan ${n}?` };
    },
    ({ int, pick, rp }) => {
      const n = pick(NAMES); const each = int(2, 6) * 500; const days = int(4, 10); const bought = int(1, 3) * 1000;
      return { a: each * days * 2 - bought, q: `${n} menabung ${rp(each)} setiap hari selama ${days} hari. Adiknya menabung dengan jumlah yang sama. Jika uang mereka digabung lalu dipakai membeli buku seharga ${rp(bought)}, berapa rupiah sisa uang mereka?` };
    },
    ({ int }) => {
      const cakes = int(3, 6); const pieces = int(6, 12); const guests = int(2, 4); const each = int(2, 4);
      return { a: cakes * pieces - guests * each, q: `Ibu membuat ${cakes} loyang kue, setiap loyang dipotong menjadi ${pieces} bagian. Sebanyak ${guests} tamu masing-masing menghabiskan ${each} potong. Berapa potong kue yang masih tersisa?` };
    },
    ({ int, pick, rp }) => {
      const n = pick(NAMES); const books = int(2, 5); const pens = int(2, 6);
      const bookPrice = int(2, 6) * 1000; const penPrice = int(2, 8) * 1000;
      return { a: books * bookPrice + pens * penPrice, q: `Di toko alat tulis, ${n} membeli ${books} buku seharga ${rp(bookPrice)} per buku dan ${pens} pulpen seharga ${rp(penPrice)} per buah. Berapa rupiah total belanja ${n}?` };
    },
    ({ int }) => {
      const speedA = int(3, 8) * 10; const speedB = int(3, 8) * 10; const hours = int(2, 5);
      return { a: (speedA + speedB) * hours, q: `Dua motor berangkat bersamaan dari tempat yang sama dan melaju berlawanan arah. Motor pertama berkecepatan ${speedA} km/jam dan motor kedua ${speedB} km/jam. Berapa km jarak kedua motor setelah ${hours} jam?` };
    },
  ],
};

const LEVEL_REWARD = {
  mudah: { point: 3, money: 700, label: '🟢 Mudah' },
  sedang: { point: 4, money: 900, label: '🟡 Sedang' },
  sulit: { point: 6, money: 1300, label: '🔴 Sulit' },
};

/**
 * Buat satu soal cerita.
 * @param {object} [options]
 * @param {'mudah'|'sedang'|'sulit'} [options.level] acak bila kosong
 * @param {() => number} [options.rng] untuk testing
 * @returns {{ q: string, a: number, level: string }}
 */
function generateStoryProblem(options = {}) {
  const rng = options.rng || Math.random;
  const helpers = makeHelpers(rng);
  const names = Object.keys(LEVELS);
  const level = LEVELS[options.level] ? options.level : names[Math.floor(rng() * names.length)];
  const pool = LEVELS[level];
  for (let attempt = 0; attempt < 10; attempt++) {
    const problem = pool[Math.floor(rng() * pool.length)](helpers);
    if (Number.isInteger(problem.a) && problem.a > 0) return { ...problem, level };
  }
  return { level: 'mudah', a: 50, q: 'Ada 20 apel di keranjang. Ibu menambah 30 apel lagi. Berapa apel di keranjang sekarang?' };
}

module.exports = { generateStoryProblem, LEVELS, LEVEL_REWARD };
