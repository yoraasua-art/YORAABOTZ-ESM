const { requireGroupAdmin } = require('../../lib/group-utils');
const guard = require('../../lib/group-guard');

module.exports = {
  name: 'antitoxic',
  category: 'group',
  aliases: ['antikasar', 'antitoxik', 'antibadword', 'antibadwords', 'badword'],
  async execute(sock, msg, args, ctx) {
    const { from, config, getGroupSettings, updateGroupSettings } = ctx;
    if (!await requireGroupAdmin(sock, msg, ctx, { needBotAdmin: false })) return;
    const action = (args[0] || '').toLowerCase();
    const word = args.slice(1).join(' ').toLowerCase().trim();
    const settings = getGroupSettings(from);
    const custom = Array.isArray(settings.toxicWords) ? settings.toxicWords : [];
    const limit = guard.warnLimit(config);

    if (action === 'on' || action === 'off') {
      updateGroupSettings(from, { antitoxic: action === 'on' });
      return sock.sendMessage(from, {
        text: action === 'on'
          ? `✅ Anti-toxic aktif. Pesan berisi kata kasar akan dihapus (jika bot admin) dan pengirim mendapat peringatan. ${limit} peringatan = kick.`
          : '✅ Anti-toxic dimatikan.',
      }, { quoted: msg });
    }
    if (action === 'add' && word) {
      if (custom.includes(word)) return sock.sendMessage(from, { text: '⚠️ Kata itu sudah ada di daftar.' }, { quoted: msg });
      updateGroupSettings(from, { toxicWords: [...custom, word].slice(-100) });
      return sock.sendMessage(from, { text: `✅ Kata *${word}* ditambahkan ke filter.` }, { quoted: msg });
    }
    if ((action === 'del' || action === 'hapus') && word) {
      updateGroupSettings(from, { toxicWords: custom.filter(item => item !== word) });
      return sock.sendMessage(from, { text: `✅ Kata *${word}* dihapus dari filter tambahan.` }, { quoted: msg });
    }
    if (action === 'list') {
      return sock.sendMessage(from, { text: `📋 Kata tambahan grup ini: ${custom.length ? custom.join(', ') : '(belum ada)'}\nDaftar bawaan: ${guard.DEFAULT_TOXIC_WORDS.length} kata.` }, { quoted: msg });
    }
    await sock.sendMessage(from, {
      text: `🛡️ *ANTI-BADWORD / ANTI-TOXIC* — status: ${settings.antitoxic ? '✅ aktif' : '❌ nonaktif'}\n\n` +
        `• ${config.prefix}antibadword on/off\n• ${config.prefix}antibadword add <kata>\n• ${config.prefix}antibadword del <kata>\n• ${config.prefix}antibadword list\n• Alias: ${config.prefix}antitoxic`,
    }, { quoted: msg });
  },
};
