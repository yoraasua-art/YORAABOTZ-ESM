const { downloadYT, toMedia } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');
module.exports = { name:'youtube', category:'download', aliases:['yt','ytmp4'], description:'Download YouTube dengan kualitas, format, dan batas ukuran.', async execute(sock,msg,args,ctx){
  const {from,config}=ctx; const p=parseDownloadOptions(args); const u=p.url;
  if(!u || !/youtu/i.test(u)) return sock.sendMessage(from,{text:`❌ Link YouTube diperlukan.\n\n${optionsHelp(config.prefix)}`},{quoted:msg});
  try { const audio=/^(mp3|m4a|audio)$/i.test(p.opts.format); const d=await downloadYT(u,audio?'mp3':'mp4',{...p.opts,maxBytes:p.maxBytes});
    return sock.sendMessage(from,audio?{audio:toMedia(d),mimetype:d.mimetype,fileName:`${(d.title||'audio').replace(/[\\/:*?"<>|]/g,'_')}.${p.opts.format==='mp3'?'mp3':'m4a'}`}:{video:toMedia(d),mimetype:d.mimetype||'video/mp4',caption:`📥 *YOUTUBE*\n${d.title||''}\n⚙️ ${p.opts.preset?`preset ${p.opts.preset} • `:''}${p.opts.quality||720}p • max ${p.opts.maxMb}MB`},{quoted:msg});
  } catch(e){ return sock.sendMessage(from,{text:`❌ Gagal download: ${e.message}`},{quoted:msg}); }
}};
