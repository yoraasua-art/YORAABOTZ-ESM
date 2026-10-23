// ============================================================
//   YORA BOTZ v8.0.2
//   Owner: Cahyo Store (08139525985)
// ============================================================

module.exports = {
  version: '8.0.2',
  // ═══════════════════════════════════════════════════════
  //                    INFORMASI BOT
  // ═══════════════════════════════════════════════════════
  botName: 'Yora Botz',
  botNumber: '6282228307663',
  ownerName: 'Cahyo Store',
  ownerNumber: '628139525985',
  ownerLID: '33033365233764@lid',
  website: 'https://fityoratopup.netlify.app/',

  // Thumbnail otomatis pada balasan command
  commandThumbnail: {
    enabled: true,
    imagePath: 'assets/logo.jpg',
  },
  prefix: '.',
  sessionName: 'session',
  botMode: 'public',
  timezone: 'Asia/Jakarta',

  // ═══════════════════════════════════════════════════════
  //                    EKONOMI
  // ═══════════════════════════════════════════════════════
  defaultLimit: 20,
  defaultMoney: 1000,
  defaultPoint: 0,

  daily: {
    money: 2000,
    point: 5,
    limit: 5,
    cooldown: 24 * 60 * 60 * 1000,
  },

  dailyStreak: {
    graceHours: 48,
    milestones: {
      3: { money: 500, limit: 5 },
      7: { money: 1500, limit: 10 },
      14: { money: 3000, limit: 20 },
      30: { money: 7500, limit: 50 },
    },
  },

  register: {
    bonusLimit: 5,
    bonusMoney: 500,
    bonusPoint: 10,
    minNameLength: 3,
    maxNameLength: 25,
    allowDuplicateName: false,
  },

  // Shop
  shop: {
    limit5:  { name: '5 Limit',   price: 5000,  gives: { limit: 5  } },
    limit20: { name: '20 Limit',  price: 18000, gives: { limit: 20 } },
    point10: { name: '10 Point',  price: 8000,  gives: { point: 10 } },
    money1k: { name: 'Rp 1.000',  price: 1500,  gives: { money: 1000 } },
    limitbooster: { name: 'Limit Booster', price: 10000, gives: { limit: 50  } },
    moneybooster: { name: 'Money Booster', price: 15000, gives: { money: 25000 } },
    pointbooster: { name: 'Point Booster', price: 20000, gives: { point: 100 } },
    vip: {
      name: 'VIP Premium',
      price: 50000,
      gives: { premium: 30, limit: 100, money: 50000, point: 500 }
    },
  },

  // ═══════════════════════════════════════════════════════
  //                    PREMIUM  🅟
  // ═══════════════════════════════════════════════════════
  premium: {
    enabled: true,
    price: 50000,
    durationDays: 30,
    dailyLimit: 100,
    dailyMoneyMultiplier: 2,
    expMultiplier: 2,
    shopDiscount: 20,
    maxLimit: 9999,
  },

  // Premium-only: terutama fitur download/resource-heavy.
  // Fitur lain tetap bisa gratis kecuali dicantumkan di sini.
  premiumOnly: [
    'dl', 'youtube', 'ytmp4', 'ytmp3', 'ytshorts', 'ytdoc',
    'tiktok', 'tiktokmp4', 'tiktokphoto',
    'instagram', 'igvideo', 'igphoto',
    'facebook', 'fbmedia',
    'twitter', 'xmedia',
    'pinterest', 'pinmedia',
    'capcut', 'gdrive', 'mediafire', 'play', 'spotify', 'emojimix',
  ],

  // Command premium di atas tetap memotong limit.
  // Jadi download = PREMIUM + LIMIT.
  premiumConsumesLimit: [
    'dl', 'youtube', 'ytmp4', 'ytmp3', 'ytshorts', 'ytdoc',
    'tiktok', 'tiktokmp4', 'tiktokphoto',
    'instagram', 'igvideo', 'igphoto',
    'facebook', 'fbmedia',
    'twitter', 'xmedia',
    'pinterest', 'pinmedia',
    'capcut', 'gdrive', 'mediafire', 'play', 'spotify',
  ],

  // ═══════════════════════════════════════════════════════
  //                    LIMIT  🅛
  // ═══════════════════════════════════════════════════════
  limitCost: {
    // DEFAULT = 0 agar plugin tidak otomatis terkena limit.
    // Hanya command yang tercantum di sini yang memakai 🅛.
    default: 0,

    // 🅛 STICKER / MEDIA TOOLS
    sticker: 1, attp: 1, ttp: 1, brat: 1, qc: 1, smeme: 1, wm: 1,
    emojimix: 1, toimg: 1,
    removebg: 2, ocr: 2, ssweb: 1,

    // 🅛 + 🅟 DOWNLOAD
    dl: 3,
    youtube: 3, ytmp4: 3, ytmp3: 3, ytshorts: 3, ytdoc: 3,
    tiktok: 3, tiktokmp4: 3, tiktokphoto: 2,
    instagram: 3, igvideo: 3, igphoto: 2,
    facebook: 3, fbmedia: 3,
    twitter: 3, xmedia: 3,
    pinterest: 2, pinmedia: 2,
    capcut: 3, gdrive: 3, mediafire: 3,
    play: 3, spotify: 3,
  },

  // Command tanpa limit
  noLimitCommands: [
    // Menu
    'menu', 'help', 'start', 'menuall', 'allmenu', 'menugame', 'menugames',
    'menufun', 'menuhiburan', 'menuekonomi', 'menueco', 'menulevel',
    'menugroup', 'menuadmin', 'menuowner', 'menuown', 'menutools', 'menutool',
    'menudownload', 'menudownloadmedia', 'menumedia', 'menuislami', 'menuislam',
    'menusticker', 'menuhd', 'menuupload', 'menuqr', 'menuinfo', 'menuai',
    'menuutilitas',
    // Info
    'runtime', 'uptime', 'rt', 'perf', 'performance', 'cleanup', 'clearcache',
    'storage', 'diskusage', 'profile', 'profil',
    // Owner info
    'owner', 'ownerku', 'own', 'info', 'botinfo',
    'ban', 'block', 'unban', 'unblock',
    'mode', 'botmode', 'self', 'public', 'ping',
    'tqto', 'thanks', 'credit', 'sc', 'fitur', 'features', 'commands', 'status', 'botstatus', 'statusbot', 'health',
    // User dasar
    'daftar', 'register', 'reg', 'unreg', 'unregister',
    'limit', 'point', 'uang', 'money', 'daily', 'shop',
    'level', 'lvl', 'rank', 'peringkat', 'leaderboard', 'lb', 'top',
    // Group admin
    'antilink', 'antispam', 'mute', 'unmute', 'welcome', 'setwelcome', 'setgoodbye',
    'kick', 'promote', 'demote', 'tagall', 'groupinfo',
    'poll', 'afk', 'brb',
    'id', 'groupid', 'cekid',
    // Owner user management
    'addlimit', 'addmoney', 'addpoint', 'setlimit', 'setmoney', 'resetuser',
    'broadcast', 'backup', 'backupdb', 'restore', 'restoredb',
    'restoreyes', 'restoreno', 'getcfg', 'getconfig', 'setcfg', 'setconfig',
    'reloadcfg', 'reloadconfig', 'showconfig', 'showcfg', 'toggle',
    // 🆕 File Manager (owner)
    'listfile', 'ls', 'listfiles', 'lsfile',
    'readfile', 'cat', 'baca', 'catfile',
    'delfile', 'rm', 'hapusfile', 'deletefile', 'removefile',
    'delfolder', 'rmdir', 'hapusfolder', 'deletefolder', 'removefolder',
    'restorefile', 'restorebackup', 'undelete', 'restoredelete',
    'savefile', 'sf',
    'reloadplugins', 'reloadp', 'reload',
    'restartbot', 'restart', 'reboot', 'autobroadcast', 'ab', 'waktubc',
    'plugincheck', 'pluginhealth', 'cekplugin',
    // Premium management
    'premium', 'prem', 'buypremium', 'addpremium', 'delpremium',
    'listpremium', 'cekpremium', 'premiuminfo',
    // 🆕 Multi-owner
    'addowner', 'addown', 'tambahowner',
    'delowner', 'delown', 'hapusowner', 'removeowner',
    'listowner', 'owners', 'daftarowner',
    // Game control
    'nyerah', 'menyerah', 'giveup', 'skip',
  ],

  // ═══════════════════════════════════════════════════════
  //                    GAME
  // ═══════════════════════════════════════════════════════
  maxBet: 10000,
  minBet: 100,
  gameTimeout: 120000,
  gameWrongAnswer: {
    enabled: true,
    cooldown: 3000,
    hintAfter: 3,
  },
  groupWarnLimit: 3,
  weeklyGame: {
    prizes: [50000, 30000, 15000],
  },
  rpg: {
    kerjaCooldown: 30 * 60 * 1000,
    kerjaMin: 400,
    kerjaMax: 1500,
    rampokCooldown: 60 * 60 * 1000,
    rampokChance: 0.4,
    bankInterest: 0.02,
    bankMaxInterestPerDay: 5000,
  },

  // ═══════════════════════════════════════════════════════
  //                    ANTI SPAM & KEAMANAN
  // ═══════════════════════════════════════════════════════
  antiSpam: true,
  spamLimit: 5,
  spamInterval: 5000,
  spamMuteDuration: 60000,
  warningBeforeMute: 2,

  security: {
    antiDelete: true,
    antiViewOnce: true,
    antiCall: false,
    antiBug: false,
    antiToxic: false,
    antiSpamGlobal: true,
  },

  // ═══════════════════════════════════════════════════════
  //                    REGISTRASI
  // ═══════════════════════════════════════════════════════
  registrationRequired: true,
  registerImageUrl: '',
  registerNameMaxLength: 20,
  registerMinAge: 10,

  // ═══════════════════════════════════════════════════════
  //                    MEDIA URL
  // ═══════════════════════════════════════════════════════
  menuImageUrl: 'https://www.image2url.com/r2/default/images/1791069524565-608e4822-bc91-4574-ac6c-a7f4f480fd21.png',
  menuVoiceEnabled: true,
  voiceMenuUrl: 'https://www.image2url.com/r2/default/audio/1790998274876-bf11a65b-538f-42a9-bca9-ef0ee310afa5.ogg',
  voiceOwnerUrl: 'https://www.image2url.com/r2/default/audio/1790998332276-f2ed502a-5594-4f02-a63a-51908936343c.ogg',
  // Menu utama mengirim logo, daftar fitur, dan voice note.
  sendMenuAs: 'both',
  sendOwnerAs: 'both',

  // ═══════════════════════════════════════════════════════
  //                    AUTO BROADCAST
  // ═══════════════════════════════════════════════════════
  autoBroadcast: {
    enabled: true,
    timezone: 'Asia/Jakarta',
    targets: [],
    allGroups: false,
    catchUpHours: 1,
  },

  databaseBackup: {
    enabled: true,
    intervalHours: 24,
    retentionCount: 7,
    notifyOnFailure: true,
    failureAlertCooldownHours: 24,
  },

  waktuPesan: {
    pagi: {
      jam: 6,
      text: `🌞 *SELAMAT PAGI* 🌞\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n✨ Semoga harimu menyenangkan\n☕ Jangan lupa sarapan dulu\n🤲 Berdoa sebelum aktivitas\n💪 Tetap semangat jalani hari\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n_"Awal yang baik akan membawa hasil yang baik"_`,
    },
    siang: {
      jam: 12,
      text: `☀️ *SELAMAT SIANG* ☀️\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🍽️ Waktunya istirahat & makan\n🕌 Jangan lupa sholat Dzuhur\n😴 Rehat sejenak dari rutinitas\n💧 Minum air putih yang cukup\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n_"Kesehatan adalah investasi terbaik"_`,
    },
    sore: {
      jam: 15,
      text: `🌤️ *SELAMAT SORE* 🌤️\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n⏰ Setengah hari telah berlalu\n🍵 Waktunya ngopi & santai\n📊 Evaluasi yang sudah dikerjakan\n🎯 Fokus ke target selanjutnya\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n_"Istirahat bukan berarti berhenti"_`,
    },
    petang: {
      jam: 18,
      text: `🌆 *SELAMAT PETANG* 🌆\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🏠 Waktunya pulang ke rumah\n🕌 Jangan lupa sholat Maghrib\n👨‍👩‍👧‍👦 Kumpul bareng keluarga\n🍽️ Nikmati makan malam\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n_"Rumah adalah tempat ternyaman"_`,
    },
    malam: {
      jam: 21,
      text: `🌙 *SELAMAT MALAM* 🌙\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n😴 Waktunya istirahat\n📱 Kurangi main HP dulu\n🤲 Berdoa sebelum tidur\n💤 Semoga mimpi indah\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n_"Tidur cukup, bangun semangat"_`,
    },
  },

  // ═══════════════════════════════════════════════════════
  //                    GRUP RESMI
  // ═══════════════════════════════════════════════════════
  officialGroup: {
    name: 'Grup Resmi Yora Botz',
    link: 'https://shorturl.at/S9mbO',
    desc: 'Grup diskusi, info update, & bantuan bot',
  },

  whitelistGroup: { enabled: false, groups: [] },

  // ═══════════════════════════════════════════════════════
  //                    LEVEL SYSTEM
  // ═══════════════════════════════════════════════════════
  levelSystem: {
    enabled: true,
    expPerMessage: 10,
    expCooldown: 30000,
    maxLevel: 100,
    rewardPerLevelUp: { money: 500, point: 5, limit: 1 },
  },

  // ═══════════════════════════════════════════════════════
  //                    MONITORING
  // ═══════════════════════════════════════════════════════
  storageMonitor: {
    enabled: true,
    thresholdPercent: 15,
    checkIntervalMs: 30 * 60 * 1000,
    cooldownMs: 24 * 60 * 60 * 1000,
  },

  ownerAlerts: {
    enabled: true,
    onModeChange: true,
    onWhitelistChange: true,
    onUnknownCommand: true,
    onSecurityEvent: true,
  },

  // ═══════════════════════════════════════════════════════
  //                    TQTO
  // ═══════════════════════════════════════════════════════
  tqto: {
    title: 'THANKS TO',
    contributors: ['Cahyo Store', 'Baileys Team', 'WhatsApp'],
    footer: 'Terima kasih telah menggunakan bot ini!',
  },
};