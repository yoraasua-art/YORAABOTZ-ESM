const media = require('../../lib/media-dl');
const { downloadYT, toMedia } = require('../../lib/downloader');

const MAX_SECONDS = 15 * 60;

async function sendSong(sock, msg, from, query, header = '🎵 *PLAY*') {
  const results = await media.searchYouTube(query, 5);
  const video = results.find(item => !item.seconds || item.seconds <= MAX_SECONDS);
  if (!video) throw media.userError(`Lagu "${query}" tidak ditemukan (atau durasinya lebih dari 15 menit).`);
  await sock.sendMessage(from, {
    text: `${header}\n\n🎶 ${video.title}\n👤 ${video.channel || '-'}\n⏱️ ${video.duration || '-'}\n🔗 ${video.url}\n\n⏳ Mengunduh audio...`,
  }, { quoted: msg });
  const data = await downloadYT(video.url, 'mp3');
  await sock.sendMessage(from, {
    audio: toMedia(data), mimetype: data.mimetype || 'audio/mp4', fileName: `${(data.title || video.title).slice(0, 80)}.m4a`, ptt: false,
  }, { quoted: msg });
}

module.exports = {
  name: 'play',
  category: 'download',
  aliases: ['lagu', 'song', 'putar'],
  sendSong,
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(from, { text: `🎵 Format: *${config.prefix}play <judul lagu>*\nContoh: ${config.prefix}play laskar pelangi` }, { quoted: msg });
    if (query.length > 100) return sock.sendMessage(from, { text: '❌ Judul terlalu panjang (maks 100 karakter).' }, { quoted: msg });
    try {
      await sendSong(sock, msg, from, query);
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal memutar lagu: ${error.message}` }, { quoted: msg });
    }
  },
};
