# YORA BOTZ v7.5.0 — OBSIDIAN LUXE

Tanggal audit: 23 Oktober 2026
Status: **audit statis lulus; tes terpilih lulus; tes integrasi penuh belum terverifikasi pada lingkungan audit**.

## Perbaikan pada paket ini

- **Menu VIP dirapikan** dengan identitas OBSIDIAN LUXE, versi dan footer konsisten.
- **Aset menu diperbaiki:** kode lama merujuk `assets/yora-menu-smooth.jpg`, file yang tidak ada di ZIP. Menu sekarang menggunakan `assets/logo.jpg` sebagai cadangan lokal.
- **Mode menu sekarang benar-benar diterapkan:** `native`, `text`, `image`, `both`, dan `voice`. Mode gambar mencoba URL khusus dahulu, kemudian logo lokal, lalu teks jika kedua gambar gagal. Mode `both` tidak menahan pengiriman gambar saat audio masih dimuat.
- **Editor konfigurasi owner diperkeras:** hanya nilai primitif tingkat utama yang dapat diubah; input teks di-escape secara aman, penulisan dilakukan lewat berkas sementara, dan objek bersarang tidak dimodifikasi lewat editor ini.
- **Unduhan voice menu dibatasi:** respons dibaca per bagian dengan batas 10 MB sebelum dirakit menjadi buffer; batas keluaran hasil konversi juga dipertahankan.
- **Konsistensi paket diperbaiki:** versi bot diselaraskan ke `7.5.0`, metadata root `package-lock.json` disinkronkan dengan `package.json`, dan `audit:local` ditambahkan.
- **Transformers diperbarui** dari `4.3.0` ke `4.3.1` di manifest dan lockfile. `sharp`, `pino`, `form-data`, dan paket langsung lain yang sudah tercantum dipertahankan pada versi terkunci yang telah diaudit.

## Keputusan kompatibilitas

- `@whiskeysockets/baileys` tetap pada `6.7.24`. Per 23 Oktober 2026, jalur terbaru yang terdeteksi adalah `7.0.0-rc14`; ini jalur pra-rilis dengan perubahan besar. Upgrade otomatis tanpa migrasi dan uji WhatsApp berisiko memutus pengiriman pesan interaktif, media, atau sesi login. Rujukan: [rilis Baileys di npm](https://www.npmjs.com/package/@whiskeysockets/baileys).
- `@distube/ytdl-core` tetap pada `4.16.12` agar tidak mengubah API downloader di tengah audit. Paket ini ditandai tidak lagi dipelihara oleh maintainer; migrasi ke alternatif seperti `youtubei.js` perlu dikerjakan sebagai perubahan terpisah dan diuji pada downloader. Rujukan: [catatan paket ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core).
- FFmpeg perlu tersedia di sistem melalui `PATH` atau variabel `FFMPEG_PATH`. Paket `ffmpeg-static` dihapus dari dependency langsung karena lockfile awal tidak memiliki entri paket yang sesuai dan proyek telah memvalidasi FFmpeg sistem melalui `npm run preflight`.

## Hasil verifikasi

- **423 file JavaScript** lolos pemeriksaan sintaks `node --check`.
- **339 file plugin** terdeteksi oleh audit statis.
- **45 tes terpilih lulus**: tes konfigurasi, batas streaming, mode menu, registry command, backup/database, keamanan plugin, Premium, pemantauan storage, ban, dan lainnya yang dapat dijalankan tanpa seluruh dependency eksternal.
- `node scripts/audit.js` memverifikasi versi, daftar dependency langsung vs lockfile, aset logo, thumbnail, dan pilihan mode menu.

### Batas verifikasi

Pemasangan dependency penuh tidak dapat diselesaikan dalam lingkungan audit karena koneksi registry npm gagal (`EAI_AGAIN`). Oleh karena itu, **tes integrasi lengkap yang memerlukan Baileys, Sharp, dan dependency eksternal belum dijalankan**, dan paket belum dapat dinyatakan teruji end-to-end pada akun WhatsApp nyata. Tes ini perlu dilakukan di server/hosting target.

## Langkah deployment yang disarankan

Gunakan Node.js 22 LTS atau Node.js aktif yang kompatibel, pasang FFmpeg di sistem, kemudian jalankan:

```bash
npm ci
npm run preflight
npm run audit:local
npm test
npm start
```

Lakukan login WhatsApp pada sesi baru bila memang diperlukan dan simpan folder `session/` secara privat. Jangan membagikan kredensial, token, atau data sesi.
