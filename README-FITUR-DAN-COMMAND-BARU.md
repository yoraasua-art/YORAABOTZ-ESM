# Daftar Lengkap Perbaikan, Tambahan Soal & Command Baru (Terdaftar di Menu)

## 1. Perbaikan Masalah Jawaban Random ("wkwk", "apa", "gatau")
- Modul **`lib/smart-answer-guard.js`** otomatis memfilter 95+ ekspresi obrolan santai (`wkwk`, `haha`, `apa`, `apaan`, `gatau`, `gak tau`, `lah`, `kok`, `tes`), kalimat tanya (`?`), dan obrolan > 4 kata agar **TIDAK dianggap sebagai jawaban salah** (`🤔 *Kurang tepat!*`).
- Mendukung **Deteksi Hampir Tepat (Typo Tolerance >= 72%)**: Memberikan respon *"🤏 Hampir Tepat! Coba cek hurufnya lagi"* tanpa penalti.

## 2. Tambahan 150+ Bank Soal untuk Semua Game (`lib/extra-questions-bank.js`)
Menambahkan soal-soal baru ke dalam:
- `asahotak`, `caklontong`, `siapakahaku`, `tekateki`, `susunkata`, `tebakkata`, `tebakkalimat`, `lengkapikalimat`, `tebaklirik`, `tebakhewan`, `tebakibukota`, `tebakanime`, `tebakpemainbola`, `tebakplanet`, `tebakpresiden`, `tebakfilm`, `tebakbendera`, dan `family100`.

## 3. Daftar Fitur & Command Baru (Sudah Terdaftar di Menu & Command Policy)
Semua plugin di bawah ini sudah dilengkapi properti `name`, `command`, `aliases`, `category`, `tags`, `help`, `execute`, dan `handler` serta disinkronkan ke `lib/menu-layout.js`, `lib/command-policy.js`, dan `plugins/menu/*.js` sehingga **bisa langsung dipanggil dengan command dan tampil di daftar menu**:

### 🎮 Menu Game (`.menugame`)
- **`.hint` / `.clue` / `.bantu`**: Membuka huruf petunjuk soal yang sedang aktif secara bertahap.
- **`.tebaknegara` / `.negara`**: Kuis menebak negara dunia dari ciri khasnya.
- **`.tebakmakanan` / `.kuliner`**: Kuis menebak kuliner & makanan tradisional Nusantara.
- **`.tebakprofesi` / `.profesi`**: Kuis menebak nama profesi dan pekerjaan.

### 🎉 Menu Fun (`.menufun`)
- **`.cekkeberuntungan` / `.cekhoki` / `.hoki`**: Cek persentase hoki, angka keberuntungan & warna hari ini.
- **`.tebakumur` / `.cekumur`**: Detektor umur fisik, umur mental, dan karakter member.
- **`.roast` / `.roasting` / `.sindir`**: Roasting lucu dan santai untuk meramaikan grup.

### 👥 Menu Group (`.menugroup`)
- **`.tagrandom` / `.pickmember` / `.undimember`**: Memilih 1 member grup secara acak untuk giveaway/arisan.
- **`.absengc` / `.mulaiabsen` / `.hadir` / `.cekabsen` / `.hapusabsen`**: Sistem daftar hadir anggota grup real-time.

### 🛠️ Menu Tools (`.menutools`)
- **`.hitungwr` / `.wr` / `.cekwr`**: Kalkulator Winrate Mobile Legends & game kompetitif (`.wr 350 54 60`).
- **`.passwordgen` / `.genpass`**: Generator password acak super kuat.
- **`.faktailmiah` / `.sains`**: Ensiklopedia fakta ilmiah dan sains dunia.

### 💰 Menu Ekonomi & Islami (`.menuekonomi` & `.menuislami`)
- **`.absen` / `.streak` / `.checkin`**: Absen harian beruntun berhadiah Uang & EXP.
- **`.klaimkode` / `.redeem`**: Klaim kode promo hadiah (`CAHYO2026`, `BOTGACOR`, `SMARTBOT`).
- **`.dzikir` / `.wirid`**: Bacaan dzikir harian lengkap Arab, Latin, Arti, dan Keutamaannya.


## 4. Audit Stabilitas Plugin (Tambahan)
- Loader plugin memeriksa `name`, `execute()`, nama command, alias, dan bentrok command/alias sebelum hasil reload diterapkan.
- Jika plugin gagal saat dijalankan, error ditangkap per-command sehingga tidak menjatuhkan proses bot.
- User mendapat pesan error yang aman; detail error dikirim ke owner bila `ownerAlerts.onPluginError` aktif.
- Command owner baru: `.plugincheck` / `.pluginhealth` / `.cekplugin` untuk memeriksa kesehatan plugin aktif.
- `.commands` tetap dibuat **dinamis dari plugin yang benar-benar berhasil dimuat**, termasuk alias, sehingga tidak perlu mendaftarkan command satu per satu secara manual.
