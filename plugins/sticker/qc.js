const maker = require('../../lib/sticker-maker');
const { getBuffer } = require('../../lib/http');

module.exports = {
  name: 'qc',
  category: 'sticker',
  aliases: ['quotly', 'quotechat'],
  async execute(sock, msg, args, ctx) {
    const { from, sender, config, getUser } = ctx;
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage;
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || quoted?.imageMessage?.caption || quoted?.videoMessage?.caption;
    const text = args.join(' ').trim() || quotedText;
    if (!text) return sock.sendMessage(from, { text: `Format: *${config.prefix}qc <teks>* atau reply pesan dengan *${config.prefix}qc*` }, { quoted: msg });
    const author = !args.length && quotedText && context?.participant ? context.participant : sender;
    const name = author === sender ? (msg.pushName || getUser(sender)?.name) : getUser(author)?.name;
    let avatar = null;
    try {
      const url = await sock.profilePictureUrl(author, 'image');
      if (url) avatar = await getBuffer(url, { maxBytes: 2 * 1024 * 1024, timeout: 8000 });
    } catch { /* tanpa foto profil */ }
    try {
      const image = await maker.quoteImage({ name: name || String(author).split('@')[0], text, avatar });
      await sock.sendMessage(from, { sticker: await maker.toSticker(image, maker.packOf(config)) }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal membuat sticker quote: ${error.message}` }, { quoted: msg });
    }
  },
};
