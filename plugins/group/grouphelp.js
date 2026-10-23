module.exports = {
  name: 'grouphelp',
  category: 'group',
  aliases: ['ghelp', 'groupmenu', 'helpgroup'],
  async execute(sock, msg, args, ctx) {
    const { config, from, isGroup, isSenderOwner } = ctx;

    if (!isGroup(from)) {
      return sock.sendMessage(from, { text: '❌ Perintah ini hanya bisa dipakai di grup.' }, { quoted: msg });
    }

    const adminNote = !isSenderOwner() ? '\n> Hanya admin grup yang bisa menjalankan fitur moderasi.' : '';

    const text = `╔══════════════════════════════════════╗
║      🛡️  *GROUP HELP MENU*  🛡️
╚══════════════════════════════════════╝

╭─────────────────────────────────────╮
│  🔐  *KEAMANAN GRUP*                │
╰─────────────────────────────────────╯

  ◈  ${config.prefix}antilink on/off
     → Blokir link dari member grup

  ◈  ${config.prefix}antispam on/off
     → Blokir spam berulang / pesan cepat

  ◈  ${config.prefix}antimention on/off · ${config.prefix}antiflood on/off
     → Cegah mass mention dan banjir pesan

  ◈  ${config.prefix}antiraid on/off · ${config.prefix}antiinvite on/off
     → Proteksi burst join dan link undangan

  ◈  ${config.prefix}antisticker on/off · ${config.prefix}antimedia on/off
     → Batasi sticker, foto, dan video

  ◈  ${config.prefix}antiaudio on/off · ${config.prefix}antifile on/off
     → Batasi audio dan dokumen

  ◈  ${config.prefix}antiforward on/off
     → Hapus pesan yang diteruskan

  ◈  ${config.prefix}securitystatus
     → Lihat status seluruh proteksi grup

  ◈  ${config.prefix}welcome on/off
     → Aktifkan atau nonaktifkan sambutan

  ◈  ${config.prefix}setwelcome <teks>
     → Atur pesan welcome custom

  ◈  ${config.prefix}setgoodbye <teks>
     → Atur pesan goodbye custom

╭─────────────────────────────────────╮
│  👥  *MODERASI MEMBER*               │
╰─────────────────────────────────────╯

  ◈  ${config.prefix}kick @user
     → Keluarkan member

  ◈  ${config.prefix}promote @user
     → Naikkan jadi admin

  ◈  ${config.prefix}demote @user
     → Turunkan status admin

  ◈  ${config.prefix}tagall <pesan>
     → Tag semua member grup

  ◈  ${config.prefix}unmute @user
     → Buka mute member

  ◈  ${config.prefix}addmember 628xxx
     → Tambahkan nomor ke grup

  ◈  ${config.prefix}delmsg
     → Hapus pesan yang dibalas

  ◈  ${config.prefix}mentionadmins <pesan>
     → Panggil semua admin

  ◈  ${config.prefix}tagmembers <pesan>
     → Tag semua member non-admin

╭─────────────────────────────────────╮
│  ℹ️  *INFO GRUP*                     │
╰─────────────────────────────────────╯

  ◈  ${config.prefix}groupinfo
     → Informasi detail grup

  ◈  ${config.prefix}id
     → Lihat ID grup / user

  ◈  ${config.prefix}groupstats
     → Statistik jumlah admin/member

  ◈  ${config.prefix}memberlist [jumlah]
     → Daftar anggota grup

  ◈  ${config.prefix}memberinfo @user
     → Detail status member

  ◈  ${config.prefix}admincheck
     → Cek status admin kamu dan bot

  ◈  ${config.prefix}botpermissions
     → Cek kemampuan bot di grup

  ◈  ${config.prefix}setppgc
     → Ubah foto profil grup dari foto yang dibalas

${adminNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡  _Panduan admin grup untuk bot profesional_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
