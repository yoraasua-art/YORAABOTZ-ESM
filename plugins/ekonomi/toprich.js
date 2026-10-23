module.exports = {
  name: 'toprich',
  category: 'ekonomi',
  aliases: ['topkaya', 'richest', 'topuang'],
  async execute(sock, msg, args, ctx) {
    const { from, loadDB, formatMoney, sender } = ctx;
    const ranking = Object.entries(loadDB())
      .map(([jid, user]) => ({ jid, name: user.name, total: (Number(user.money) || 0) + (Number(user.bank) || 0) }))
      .sort((a, b) => b.total - a.total);
    if (!ranking.length) return sock.sendMessage(from, { text: 'Belum ada data pengguna.' }, { quoted: msg });
    const top = ranking.slice(0, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const number = jid => String(jid).split('@')[0];
    const lines = top.map((entry, index) => `${medals[index] || `${index + 1}.`} @${number(entry.jid)}${entry.name ? ` (${entry.name})` : ''} — ${formatMoney(entry.total)}`);
    const myRank = ranking.findIndex(entry => entry.jid === sender) + 1;
    await sock.sendMessage(from, {
      text: `💰 *TOP 10 TERKAYA*\n_(dompet + bank)_\n\n${lines.join('\n')}${myRank ? `\n\nPeringkatmu: #${myRank}` : ''}`,
      mentions: top.map(entry => entry.jid),
    }, { quoted: msg });
  },
};
