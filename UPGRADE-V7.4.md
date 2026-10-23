# YORA BOTZ v7.4.0 —

## Fokus upgrade

V7.4 bukan hanya bump nomor versi. Registry command, loader plugin, menu, owner tools, ekonomi, dokumentasi, dan preflight deployment diperbarui sebagai satu paket.

### Command & plugin
- `.commands` memakai `lib/command-registry.js` sebagai single source of truth.
- Alias ikut terdaftar otomatis.
- Command kategori owner disembunyikan dari `.commands` user biasa.
- `.plugincheck` / `.pluginhealth` / `.cekplugin` tetap melakukan audit command dan alias.
- `.systemcheck` / `.syscheck` / `.cekserver` / `.healthcheck` memeriksa dependency, FFmpeg, folder runtime, dan status plugin.
- Loader memberi metadata versi `7.4.0` pada plugin yang dimuat.
- Reload gagal tidak mengganti registry plugin aktif.
- `.buy` ditambahkan kembali dan menggunakan `getShopItems()` yang sama dengan `.shop`, sehingga harga Premium konsisten.

### UI
- Menu menggunakan identitas `v7.4.0 · `.
- Footer menu diperbarui menjadi gaya Premium WhatsApp Assistant.
- `.status` / `.statusbot` memiliki dashboard runtime yang lebih ringkas dan informatif.

### QA
- 286 file plugin terdeteksi.
- 277 plugin mendeklarasikan metadata `name` langsung.
- 7 plugin factory menghasilkan metadata saat `require()`.
- 0 bentrok command/alias pada audit statis.
- 0 syntax error pada seluruh JavaScript yang diaudit.
- Test yang tidak membutuhkan dependency eksternal: 54/54 lulus pada environment audit.
- Test Premium: 3/3 lulus setelah `.buy` dipulihkan.

## Deployment

```bash
npm install
npm run preflight
npm test
npm start
```

`npm run preflight` sengaja gagal jika dependency belum terpasang. Jangan menghapus dependency dari `package.json`; sticker, QR, Baileys, Sharp, dan fitur media menggunakannya.

## Stability & Performance Downloader
- Global download concurrency default: 2.
- Retry menggunakan exponential backoff + jitter.
- Circuit breaker membuka cooldown provider setelah 3 kegagalan beruntun.
- Provider dalam cooldown dilewati sementara agar fallback tidak membebani server/provider.
- Health checks berjalan bertahap dengan concurrency terbatas.
- yt-dlp timeout mengikuti konfigurasi runtime dengan batas maksimum 180 detik.
- Konfigurasi baru melalui `.providerconfig concurrency <1-5>` dan `.providerconfig cooldown <detik>`.
- `.providerstatus` menampilkan aktivitas, antrean, dan provider yang sedang cooldown.
