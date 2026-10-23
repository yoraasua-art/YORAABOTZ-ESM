const maker = require('../../lib/sticker-maker');

module.exports = {
  name: 'attp',
  category: 'sticker',
  aliases: ['attp2', 'animtext'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.join(' ').trim() || quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    if (!text) return sock.sendMessage(from, { text: `Format: *${config.prefix}attp <teks>*` }, { quoted: msg });
    try {
      const image = await maker.attpWebp(text);
      const sticker = await maker.toSticker(image, maker.packOf(config));
      await sock.sendMessage(from, { sticker }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal membuat sticker animasi: ${error.message}` }, { quoted: msg });
    }
  },
};
