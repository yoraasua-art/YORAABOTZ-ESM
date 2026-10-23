const bank = require('./bank');

module.exports = {
  name: 'tabung',
  category: 'ekonomi',
  aliases: ['nabung', 'deposit', 'depo'],
  execute: (sock, msg, args, ctx) => bank.deposit(sock, msg, args, ctx),
};
