# YORA BOTZ v8.0.2 — Audit & Fix Notes

## Perubahan terapan
- Default menu diubah dari `native` ke `text`.
- Mode `native` dari konfigurasi lama diperlakukan sebagai teks agar pengguna tidak kehilangan menu setelah upgrade.
- Perintah `.menupicker` sekarang menampilkan daftar perintah teks dan tetap menyembunyikan `.menuowner` dari pengguna non-owner.
- Parser interaksi tombol/Native Flow di `index.js` dan modul `lib/native-flow-menu.js` yang tidak lagi diperlukan dihapus.
- Audit konfigurasi hanya menerima mode menu yang didukung: `text`, `image`, `both`, `voice`.
- Versi paket, lockfile, konfigurasi, runtime info, dan pengujian UI diperbarui ke 8.0.2.

## Verifikasi lokal
- `node scripts/audit.js`: lulus; 426 berkas JavaScript diperiksa, termasuk 340 berkas plugin; versi dan lockfile selaras; logo ditemukan.
- Pemeriksaan sintaks `node --check` untuk seluruh 426 berkas `.js`/`.mjs`: lulus.
- `node --test test/esm-compat.test.mjs`: lulus, 2/2.
- `node --test test/menu-mode.test.js`: lulus, 7/7; mencakup default teks, fallback konfigurasi Native Flow lama, mode gambar/voice, dan menu kategori tanpa tombol.
- Pemeriksaan versi `package.json`, `package-lock.json`, `config.js`, serta `lib/version.js`: lulus; semuanya `8.0.2`.
- Pemindaian whitespace: lulus setelah membersihkan tiga baris dengan spasi di akhir.
- `npm test`: 90 tes terdeteksi, 84 lulus dan 6 suite gagal dimulai karena dependensi belum tersedia (`wa-sticker-formatter` dan `qrcode`); tidak ada kegagalan suite yang dapat ditentukan sebagai bug aplikasi sebelum dependensi terpasang.
- `npm run preflight`: memperlihatkan delapan dependency npm belum tersedia di lingkungan audit. FFmpeg tersedia.
- `npm ci` tidak selesai karena registry npm tidak dapat di-resolve (`EAI_AGAIN registry.npmjs.org`), sehingga tes integrasi yang membutuhkan paket tersebut belum dapat diverifikasi penuh.

## Batas verifikasi
Tidak ada uji pairing, kirim pesan/media real-time, atau reconnect pada sesi ini. FFmpeg tetap dibutuhkan hanya jika mode voice perlu dikonversi ke voice note; mode teks tidak memerlukannya.
