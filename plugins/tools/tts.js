const { getBuffer } = require('../../lib/http');

const LANGS = ['id', 'en', 'ja', 'ko', 'ar', 'ms', 'jw', 'su', 'zh', 'es', 'fr', 'de', 'ru', 'th', 'hi'];

function chunks(text, size = 180) {
  const parts = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if ((current + ' ' + word).trim().length > size) { if (current) parts.push(current); current = word.slice(0, size); }
    else current = (current + ' ' + word).trim();
  }
  if (current) parts.push(current);
  return parts;
}

async function synthesize(text, lang = 'id') {
  const buffers = [];
  for (const part of chunks(text)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(part)}`;
    buffers.push(await getBuffer(url, { maxBytes: 2 * 1024 * 1024, timeout: 15000, headers: { Referer: 'https://translate.google.com/' } }));
  }
  return Buffer.concat(buffers);
}

module.exports = {
  name: 'tts',
  category: 'tools',
  aliases: ['say', 'suara', 'texttospeech'],
  synthesize,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    let lang = 'id';
    let words = [...args];
    if (words[0] && LANGS.includes(words[0].toLowerCase()) && words.length > 1) lang = words.shift().toLowerCase();
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = words.join(' ').trim() || quoted?.conversation || quoted?.extendedTextMessage?.text || '';
    if (!text) return sock.sendMessage(from, { text: `🔊 Format: *${config.prefix}tts [kode bahasa] <teks>*\nContoh: ${config.prefix}tts halo semua · ${config.prefix}tts en good morning\nBahasa: ${LANGS.join(', ')}` }, { quoted: msg });
    if (text.length > 500) return sock.sendMessage(from, { text: '❌ Teks maksimal 500 karakter.' }, { quoted: msg });
    try {
      const audio = await synthesize(text, lang);
      await sock.sendMessage(from, { audio, mimetype: 'audio/mpeg', ptt: true }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal membuat suara: ${error.message}` }, { quoted: msg });
    }
  },
};
