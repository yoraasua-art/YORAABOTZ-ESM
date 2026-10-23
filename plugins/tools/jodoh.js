const COUPLE_HEART = '👩‍❤️‍👨'; // perempuan + laki-laki
const COUPLE_KISS = '👩‍❤️‍💋‍👨';
const COUPLE_HAND = '👫';

module.exports = {
  name: 'jodoh',
  category: 'tools',
  aliases: ['cekjodoh', 'love'],
  async execute(sock, msg, args, ctx) {
    const { from, mentioned } = ctx;

    if (!mentioned || mentioned.length === 0) {
      return sock.sendMessage(from, { text: '❌ Tag user!\nContoh: `.jodoh @user`' });
    }

    const target = mentioned[0];
    const targetName = target.split('@')[0];
    const persen = Math.floor(Math.random() * 101);

    // Emoji pasangan sengaja dipakai versi laki-laki + perempuan (bukan 💑/💏 yang
    // tampil beda-beda di tiap perangkat dan kadang jadi dua laki-laki).
    let status = '';
    if (persen >= 90) status = `${COUPLE_KISS} *JODOH SEJATI!*`;
    else if (persen >= 70) status = `${COUPLE_HEART} *Sangat cocok!*`;
    else if (persen >= 50) status = `${COUPLE_HAND} *Cocok!*`;
    else if (persen >= 30) status = '🤔 *Lumayan...*';
    else status = '💔 *Kurang cocok*';

    await sock.sendMessage(from, {
      text: `${COUPLE_HEART} *CEK JODOH*\n\n👨 @${ctx.sender.split('@')[0]}  ❤️  @${targetName} 👩\n\n📊 Tingkat kecocokan:\n*${persen}%*\n\n${status}`,
      mentions: [ctx.sender, target],
    });
  },
};