# YORA BOTZ — Plugin Audit

Audit statis untuk versi 7.4.0 .

## Hasil

- File plugin: 286 JavaScript plugin (setelah penambahan fitur V7.4).
- Syntax check: 0 error.
- 277 plugin mendeklarasikan metadata `name` langsung.
- 7 plugin menggunakan factory internal yang menghasilkan object plugin saat `require()`:
  - game/tebakkalimat.js
  - game/susunkata.js
  - game/tebaklirik.js
  - game/tekateki.js
  - ekonomi/nambang.js
  - ekonomi/mancing.js
  - ekonomi/berburu.js
- Command registry dan `.commands` mengambil data dari `ctx.pluginList`, sehingga plugin baru tidak perlu ditambahkan manual ke daftar command.
- `.plugincheck`, `.pluginhealth`, dan `.cekplugin` menampilkan health check dan plugin yang gagal dimuat.
- Loader mempertahankan daftar plugin aktif ketika proses reload gagal.
- Error saat eksekusi satu plugin ditangkap oleh handler per-command agar tidak menjatuhkan proses bot.

## V7.4 hardening

- Central command registry (`lib/command-registry.js`) dipakai oleh daftar command dan dashboard agar command/alias tidak dikelola manual di banyak tempat.
- `.commands` menyembunyikan kategori owner untuk user biasa.
- `.systemcheck` melakukan preflight dependency, FFmpeg, folder runtime, dan status plugin.
- `.buy` dipulihkan sebagai plugin ekonomi resmi agar test dan command toko konsisten dengan `.shop`.
- Tampilan menu diberi identitas versi/codename  tanpa mengubah format command yang sudah kompatibel.

## Dependency

Project mendeklarasikan `wa-sticker-formatter` pada `package.json`. Jika dependency belum terpasang pada server, plugin sticker dapat gagal dimuat. Jalankan `npm install`/`npm ci` sebelum `npm start`.

Jika dependency gagal diunduh, cek koneksi/NPM registry server terlebih dahulu. Jangan menghapus dependency tersebut karena dipakai oleh plugin sticker.
