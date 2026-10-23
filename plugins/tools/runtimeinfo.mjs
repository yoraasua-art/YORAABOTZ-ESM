import os from 'node:os';
import process from 'node:process';

export default {
  name: 'runtimeinfo',
  category: 'tools',
  aliases: ['nodeinfo', 'runtime'],
  version: '8.0.2',
  description: 'Menampilkan versi runtime dan ringkasan server.',
  async execute(sock, msg, args, ctx) {
    const { from } = ctx;
    const memoryTotal = os.totalmem();
    const memoryFree = os.freemem();
    const toMiB = (value) => Math.round(value / 1024 / 1024).toLocaleString('id-ID');
    const text = [
      '🧩 *YORA BOTZ · RUNTIME INFO*',
      '',
      `• Node.js: ${process.version}`,
      `• Platform: ${process.platform} (${process.arch})`,
      `• Uptime proses: ${Math.floor(process.uptime() / 60)} menit`,
      `• RAM sistem: ${toMiB(memoryFree)} / ${toMiB(memoryTotal)} MiB tersedia`,
      '',
      'Info diagnostik lokal; tidak mengirim data server ke layanan eksternal.',
    ].join('\n');
    return sock.sendMessage(from, { text }, { quoted: msg });
  },
};
