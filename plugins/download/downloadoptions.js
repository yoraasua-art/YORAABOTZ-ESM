const { optionsHelp } = require('../../lib/download-options');
module.exports = { name:'downloadoptions', category:'download', aliases:['dlhelp','downloadhelp','dlopsi'], description:'Panduan kualitas, format, bitrate, dan batas ukuran downloader.', async execute(sock,msg,args,ctx){ return sock.sendMessage(ctx.from,{text:optionsHelp(ctx.config.prefix)},{quoted:msg}); } };
