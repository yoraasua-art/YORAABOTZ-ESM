const path = require('path');
const { loadVoiceMessage, renderMenu } = require('../../lib/menu-layout');

function getTimeGreeting(timeZone) {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date()));
  if (hour < 11) return '🌞 Selamat pagi';
  if (hour < 15) return '☀️ Selamat siang';
  if (hour < 18) return '🌤️ Selamat sore';
  if (hour < 21) return '🌆 Selamat petang';
  return '🌙 Selamat malam';
}

function formatTanggal(timeZone) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

async function resolveMentionJid(sock, msg, sender) {
  const key = msg?.key || {};
  const candidates = [
    key.senderPn,
    key.participantPn,
    key.participantAlt,
    key.remoteJidAlt,
  ].filter(value => typeof value === 'string' && value.endsWith('@s.whatsapp.net'));

  if (candidates.length) return candidates[0];

  // Baileys supplies a PN JID directly for many chats; keep the mention intact
  // even when the event does not include msg.key (for example test/adapted callers).
  if (typeof sender === 'string' && sender.endsWith('@s.whatsapp.net')) return sender;

  if (typeof sender === 'string' && sender.endsWith('@lid')) {
    try {
      const mapped = await sock.signalRepository?.lidMapping?.getPNForLID?.(sender);
      if (typeof mapped === 'string' && mapped.endsWith('@s.whatsapp.net')) return mapped;
    } catch (error) {
      console.warn('⚠️ Gagal resolve LID ke nomor untuk menu:', error.message);
    }
  }

  return null;
}

module.exports = {
  name: 'menu',
  category: 'menu',
  aliases: ['help', 'start'],
  async execute(sock, msg, args, ctx) {
    const { config, from } = ctx;
    const user = ctx.user || { limit: 0, money: 0, point: 0, exp: 0, registered: false };
    const prefix = config.prefix || '.';
    const timeZone = config.autoBroadcast?.timezone || 'Asia/Jakarta';
    const timeGreeting = getTimeGreeting(timeZone);
    const sender = ctx.sender;
    const mentionJid = await resolveMentionJid(sock, msg, sender);
    const senderNumber = mentionJid
      ? mentionJid.split('@')[0].replace(/[^0-9]/g, '')
      : (ctx.senderNumber && !String(ctx.senderNumber).includes('lid') ? ctx.senderNumber : '');
    const greetingName = senderNumber ? `@${senderNumber}` : (ctx.pushName || 'Pengguna');
    const mentions = mentionJid ? [mentionJid] : [];
    const mentionOptions = mentions.length ? { mentions } : {};
    // Use the asset that is actually shipped in the ZIP; the old smooth-image path was missing.
    const menuImagePath = path.resolve(__dirname, '../../assets/logo.jpg');
    const isOwner = Boolean(ctx.isSenderOwner && ctx.isSenderOwner());
    const isPremium = Boolean(ctx.isPremium && ctx.isPremium());
    const role = isOwner ? 'Owner' : isPremium ? 'Premium' : user.registered ? 'Anggota' : 'Belum terdaftar';
    const level = Math.floor(Math.sqrt((user.exp || 0) / 100)) + 1;
    const uptime = process.uptime();
    const uptimeText = `${Math.floor(uptime / 3600)} jam ${Math.floor((uptime % 3600) / 60)} menit`;
    const totalUsers = ctx.loadDB ? Object.keys(ctx.loadDB()).length : 0;
    const formatMoney = ctx.formatMoney || (amount => `Rp ${amount}`);

    const sections = [
      {
        icon: '👋',
        title: `Halo kak ${greetingName}, ${timeGreeting}${isOwner ? ' 👑' : ''}`,
        items: [
          `Peran: *${role}*`,
          `Level: *${level}* · EXP: *${user.exp || 0}*`,
          `Limit: *${user.limit}* · Uang: *${formatMoney(user.money)}*`,
          `Poin: *${user.point}*`,
        ],
      },
      {
        icon: '📚',
        title: 'PILIH KATEGORI',
        items: [
          `${prefix}menugame — permainan dan tebak-tebakan`,
          `${prefix}menufun — hiburan`,
          `${prefix}menuekonomi — profil, ekonomi, dan toko`,
          `${prefix}menulevel — level dan peringkat`,
          `${prefix}menugroup — pengaturan grup`,
          `${prefix}menumedia — unduh, stiker, dan olah media`,
          `${prefix}menuislami — kuis Islami`,
          `${prefix}menutools — AI dan utilitas`,
          ...(isOwner ? [`${prefix}menuowner — panel owner`] : []),
        ],
      },
      {
        icon: '⚡',
        title: 'FITUR DASAR',
        items: [
          `${prefix}daftar <nama> — daftar akun`,
          `${prefix}profile — lihat profil`,
          `${prefix}daily — klaim hadiah harian`,
          `${prefix}leaderboard — lihat peringkat`,
          `${prefix}premium — informasi Premium`,
          `${prefix}commands — daftar semua fitur`,
          `${prefix}status — status bot & kesehatan plugin`,
          `${prefix}menuall (${prefix}allmenu) — semua fitur per kategori`,
          `${prefix}sc — informasi dan aturan script`,
          `${prefix}perf — statistik durasi dan error fitur`,
          `${prefix}tutorial — panduan penggunaan`,
          `${prefix}ping — cek respons bot`,
        ],
      },
      {
        icon: 'ℹ️',
        title: 'INFORMASI BOT',
        items: [
          `Tanggal: ${formatTanggal(timeZone)}`,
          `Total akun: *${totalUsers}*`,
          `Waktu aktif: *${uptimeText}*`,
          `Owner: ${config.ownerName}`,
          `Situs: ${config.website}`,
          `Grup resmi: ${config.officialGroup?.link || 'Belum tersedia'}`,
        ],
      },
    ];

    if (config.tqto?.contributors?.length) {
      sections.push({
        icon: '🙏',
        title: config.tqto.title,
        items: config.tqto.contributors.map((contributor, index) => {
          const name = typeof contributor === 'string' ? contributor : (contributor.name || 'Tanpa nama');
          return `${index + 1}. ${name}`;
        }),
      });
    }

    const menuText = renderMenu({
      botName: config.botName,
      title: 'MENU UTAMA',
      prefix,
      sections,
      footer: ['L = Limit · P = Premium · O = Owner · A = Admin'],
    });
    const supportedModes = ['text', 'image', 'both', 'voice'];
    const mode = supportedModes.includes(config.sendMenuAs) ? config.sendMenuAs : 'text';
    const sends = [];
    const sendVoice = async () => {
      if (config.menuVoiceEnabled === false || !config.voiceMenuUrl) return false;
      try {
        await sock.sendMessage(from, await loadVoiceMessage(config.voiceMenuUrl), { quoted: msg });
        return true;
      } catch (error) {
        console.warn('⚠️ Voice menu dilewati:', error.message);
        // Do not fail silently: the menu remains usable even if audio conversion
        // or delivery fails (for example, FFmpeg is missing on the host).
        try {
          await sock.sendMessage(from, {
            text: '⚠️ audio gagal dikirim; menu tetap bisa digunakan. Coba lagi nanti atau hubungi owner jika terus terjadi.',
          }, { quoted: msg });
        } catch (noticeError) {
          console.warn('⚠️ Gagal mengirim notifikasi audio menu:', noticeError.message);
        }
        return false;
      }
    };

    // Prefer the bundled logo so an expired/unreachable remote URL does not
    // produce a warning or delay menu delivery. Use the configured URL as fallback.
    const imageSources = [...new Set([menuImagePath, config.menuImageUrl].filter(Boolean))];
    const sendImageMenu = async (caption) => {
      for (const imageSource of imageSources) {
        try {
          await sock.sendMessage(from, {
            image: { url: imageSource },
            caption,
            ...mentionOptions,
          }, { quoted: msg });
          return true;
        } catch (error) {
          console.warn('⚠️ Sumber gambar menu dilewati:', error.message);
        }
      }
      return false;
    };

    // Mode yang didukung adalah teks, gambar, gambar+voice, atau voice. Mode lama
    // `native` sengaja dinonaktifkan agar menu tidak mengirim tombol interaktif.
    if (mode === 'text') {
      sends.push(sock.sendMessage(from, { text: menuText, ...mentionOptions }, { quoted: msg }));
    } else if (mode === 'image' || mode === 'both') {
      // Jalankan pengambilan voice lebih dulu secara non-blocking; gambar/tulisan tetap terkirim.
      const voicePromise = mode === 'both' ? sendVoice() : Promise.resolve(false);
      const imageSent = await sendImageMenu(menuText);
      if (!imageSent) {
        await sock.sendMessage(from, { text: menuText, ...mentionOptions }, { quoted: msg });
      }
      if (mode === 'both') sends.push(voicePromise);
    } else if (mode === 'voice') {
      const sent = await sendVoice();
      if (!sent) await sock.sendMessage(from, { text: menuText, ...mentionOptions }, { quoted: msg });
    } else {
      // Jaga perilaku fail-safe jika ada mode yang tidak dikenal dari konfigurasi lama.
      sends.push(sock.sendMessage(from, { text: menuText, ...mentionOptions }, { quoted: msg }));
    }

    await Promise.allSettled(sends);
  },
};
