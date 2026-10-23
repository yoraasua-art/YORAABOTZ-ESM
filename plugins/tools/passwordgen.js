module.exports = {
  name: 'passwordgen',
  command: ['passwordgen', 'genpass', 'buatpassword'],
  aliases: ['genpass', 'buatpassword'],
  category: 'tools',
  tags: ['tools'],
  help: ['passwordgen', 'genpass'],
  description: 'Membuat kata sandi acak super aman (Strong Password Generator)',
  async execute(ctx) {
    const rawLen = parseInt((ctx.args && ctx.args[0]) || '16', 10);
    const length = Math.min(32, Math.max(8, isNaN(rawLen) ? 16 : rawLen));
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+?';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return ctx.reply(
      `🔐 *STRONG PASSWORD GENERATOR*\n\n` +
      `📏 Panjang: *${length} Karakter*\n` +
      `🔑 Password: ` + '`' + pass + '`' + `\n\n` +
      `_Simpan password ini di tempat yang aman!_`
    );
  }
};
module.exports.handler = module.exports.execute;
