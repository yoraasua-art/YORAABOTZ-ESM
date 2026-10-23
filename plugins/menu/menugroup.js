const { renderMenu } = require('../../lib/menu-layout');

module.exports = {
  name: 'menugroup',
  category: 'menu',
  aliases: ['menuadmin'],
  async execute(sock, msg, args, ctx) {
    const { config, from, isGroup, pluginList } = ctx;
    if (!isGroup(from)) {
      return sock.sendMessage(from, { text: '❌ Menu ini hanya dapat digunakan di dalam grup.' }, { quoted: msg });
    }

    const menuText = renderMenu({
      botName: config.botName,
      title: 'FITUR GRUP',
      prefix: config.prefix,
      pluginList,
      includeCategories: ['group'],
      sections: [
        { icon: '🛡️', title: 'KEAMANAN', items: [`${config.prefix}antilink on/off`, `${config.prefix}antispam on/off`, `${config.prefix}antibadword on/off/add/del/list`, `${config.prefix}antidelete on/off`, `${config.prefix}antimention on/off`, `${config.prefix}antiflood on/off`, `${config.prefix}antiraid on/off`, `${config.prefix}antiinvite on/off`, `${config.prefix}antisticker on/off`, `${config.prefix}antimedia on/off`, `${config.prefix}antiaudio on/off`, `${config.prefix}antifile on/off`, `${config.prefix}antiforward on/off`, `${config.prefix}securitystatus`, `${config.prefix}mute @user <durasi>`, `${config.prefix}unmute @user`, `${config.prefix}grouphelp`] },
        { icon: '👋', title: 'PESAN SELAMAT DATANG & PAMIT', items: [`${config.prefix}welcome on/off`, `${config.prefix}setwelcome <teks>`, `${config.prefix}setgoodbye <teks>`] },
        { icon: '👥', title: 'KELOLA ANGGOTA', items: [`${config.prefix}kick @user`, `${config.prefix}promote @user`, `${config.prefix}demote @user`, `${config.prefix}addmember 628xxx`, `${config.prefix}delmsg — hapus pesan yang dibalas`, `${config.prefix}tagall <pesan>`, `${config.prefix}tagmembers <pesan>`, `${config.prefix}mentionadmins <pesan>`, `${config.prefix}listadmin`, `${config.prefix}memberlist [jumlah]`, `${config.prefix}memberinfo @user`, `${config.prefix}sider [hari] — anggota pasif`] },
        { icon: '⚠️', title: 'PERINGATAN', items: [`${config.prefix}warn @user <alasan> — 3 peringatan = kick`, `${config.prefix}unwarn @user`, `${config.prefix}listwarn`] },
        { icon: '⚙️', title: 'PENGATURAN GRUP', items: [`${config.prefix}opengc · ${config.prefix}closegc`, `${config.prefix}setnamagc <nama>`, `${config.prefix}setdesc <deskripsi>`, `${config.prefix}setppgc — balas foto`, `${config.prefix}linkgc · ${config.prefix}revoke`, `${config.prefix}admincheck`, `${config.prefix}botpermissions`, `${config.prefix}pengingatsholat <kota>`] },
        { icon: '📊', title: 'POLL GRUP', items: [`${config.prefix}poll <pertanyaan> | <opsi 1> | <opsi 2>`] },
        { icon: '😴', title: 'AFK', items: [`${config.prefix}afk <alasan> — tandai dirimu AFK; bot memberi tahu jika kamu di-tag/di-reply, dan menyambutmu saat kembali`] },
        { icon: 'ℹ️', title: 'INFORMASI GRUP', items: [`${config.prefix}groupinfo`, `${config.prefix}groupstats`, `${config.prefix}id`] },
      ],
      footer: ['Sejumlah fitur memerlukan bot sebagai admin grup.'],
    });
    await sock.sendMessage(from, { text: menuText }, { quoted: msg });
  },
};
