const media = require('../../lib/media-dl');
const { downloadYT, downloadTT, downloadIG, toMedia, fetchBuffer } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');
async function send(sock, from, msg, payload) { return sock.sendMessage(from, payload, { quoted: msg }); }
module.exports = {
  name: 'dl', category: 'download', aliases: ['download', 'mediaurl'],
  description: 'Downloader universal dengan pilihan kualitas, format, dan batas ukuran.',
  async execute(sock, msg, args, ctx) {
    const { from, config } = ctx; const parsed = parseDownloadOptions(args); const u = parsed.url;
    if (!u || /^(help|opsi)$/i.test(u)) return send(sock, from, msg, { text: optionsHelp(config.prefix) });
    const { opts, maxBytes } = parsed;
    try {
      if (/youtu\.be|youtube\.com/i.test(u)) { const d = await downloadYT(u, /^(mp3|m4a|audio)$/i.test(opts.format) ? 'mp3' : 'mp4', { ...opts, maxBytes }); return send(sock, from, msg, /^(mp3|m4a|audio)$/i.test(opts.format) ? { audio: toMedia(d), mimetype: d.mimetype, fileName: `${d.title || 'audio'}.${opts.format === 'mp3' ? 'mp3' : 'm4a'}` } : { video: toMedia(d), mimetype: d.mimetype || 'video/mp4', caption: `📥 *YOUTUBE*\n${d.title || ''}\n⚙️ ${opts.quality || 720}p • ${opts.maxMb}MB` }); }
      if (/tiktok\.com/i.test(u)) { const d = await downloadTT(u, { ...opts, maxBytes }); if (d.images) return Promise.all(d.images.slice(0,10).map((x,i)=>send(sock,from,msg,{image:{url:x},caption:i===0?'📥 *TIKTOK*':''}))); const b = d.buffer || await fetchBuffer(d.url, { maxBytes }); return send(sock,from,msg,{video:b,mimetype:'video/mp4',caption:`📥 *TIKTOK*\n${d.title||''}\n⚙️ max ${opts.maxMb}MB`}); }
      if (/instagram\.com/i.test(u)) { const d = await downloadIG(u, { ...opts, maxBytes }); return Promise.all(d.items.slice(0,5).map(async (x,i)=>x.type==='video'?send(sock,from,msg,{video:x.buffer || await fetchBuffer(x.url,{maxBytes}),mimetype:'video/mp4',caption:i===0?'📥 *INSTAGRAM*':''}):send(sock,from,msg,{image:x.buffer || await fetchBuffer(x.url,{maxBytes}),caption:i===0?'📥 *INSTAGRAM*':''}))); }
      if (media.hostMatches(u,['facebook.com','fb.watch','fb.com'])) { const d=await media.downloadFacebook(u,{...opts,maxBytes}); const b=d.buffer || await fetchBuffer(d.url,{maxBytes}); return send(sock,from,msg,{video:b,mimetype:'video/mp4',caption:`📘 ${d.title||'Facebook Video'}`}); }
      if (media.hostMatches(u,['twitter.com','x.com'])) { const d=await media.downloadTwitter(u,{...opts,maxBytes}); if(!d.media.length) return send(sock,from,msg,{text:`📝 Tweet @${d.author||'-'} tidak memiliki media.`}); const item=d.media[0]; const b=item.buffer || await fetchBuffer(item.url,{maxBytes}); return send(sock,from,msg,{[item.type]:b,...(item.type==='video'?{mimetype:'video/mp4'}:{}),caption:`🐦 @${d.author||'-'}\n${d.text||''}`.slice(0,1000)}); }
      if (media.hostMatches(u,['pinterest.com','pin.it','pinterest.co.uk','id.pinterest.com'])) { const p=await media.downloadPinterest(u,{...opts,maxBytes}); const b=p.buffer || await fetchBuffer(p.url,{maxBytes}); return p.type==='video'?send(sock,from,msg,{video:b,mimetype:'video/mp4',caption:`📌 ${p.title||'Pinterest'}`}):send(sock,from,msg,{image:b,caption:`📌 ${p.title||'Pinterest'}`}); }
      return send(sock,from,msg,{text:'❌ Platform belum didukung. Gunakan link YouTube, TikTok, Instagram, Facebook, X/Twitter, atau Pinterest.'});
    } catch(e) { return send(sock,from,msg,{text:`❌ Downloader gagal: ${e.message}`}); }
  }
};
