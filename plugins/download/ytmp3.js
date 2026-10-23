const { downloadYT, toMedia } = require('../../lib/downloader');
const { parseDownloadOptions, optionsHelp } = require('../../lib/download-options');
module.exports={name:'ytmp3',category:'download',aliases:['yta'],description:'Download audio YouTube dengan format m4a/mp3 dan batas ukuran.',async execute(sock,msg,args,ctx){
 const {from,config}=ctx; const p=parseDownloadOptions(args); const u=p.url; if(!u||!/youtu/i.test(u))return sock.sendMessage(from,{text:`❌ Kirim link YouTube.\n\n${optionsHelp(config.prefix)}`},{quoted:msg});
 try{const fmt=p.opts.format==='mp3'?'mp3':'m4a'; const d=await downloadYT(u,'mp3',{...p.opts,format:fmt,maxBytes:p.maxBytes}); return sock.sendMessage(from,{audio:toMedia(d),mimetype:d.mimetype,fileName:`${(d.title||'audio').replace(/[\\/:*?"<>|]/g,'_')}.${fmt}`},{quoted:msg})}catch(e){return sock.sendMessage(from,{text:`❌ Gagal download: ${e.message}`},{quoted:msg})}
}};
