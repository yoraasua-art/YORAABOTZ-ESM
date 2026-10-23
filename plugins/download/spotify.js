const media = require('../../lib/media-dl');
const { sendSong } = require('./play');

module.exports = {
  name: 'spotify',
  category: 'download',
  aliases: ['spotifydl', 'spdl'],
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx;
    const url = media.firstUrl(args);
    if (!url || !media.hostMatches(url, ['open.spotify.com'])) {
      return sock.sendMessage(from, { text: `❌ Kirim link lagu Spotify.\nContoh: *${config.prefix}spotify https://open.spotify.com/track/...*` }, { quoted: msg });
    }
    try {
      const info = await media.spotifyInfo(url);
      const query = `${info.title} ${info.artist}`.trim();
      await sendSong(sock, msg, from, `${query} audio`, `🟢 *SPOTIFY*\n${info.title}${info.artist ? ` — ${info.artist}` : ''}\n_Audio diambil dari YouTube (Spotify tidak menyediakan unduhan langsung)._`);
    } catch (error) {
      await sock.sendMessage(from, { text: `❌ Gagal memproses Spotify: ${error.message}` }, { quoted: msg });
    }
  },
};
