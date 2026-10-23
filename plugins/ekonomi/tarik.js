const bank = require('./bank');

module.exports = {
  name: 'tarik',
  category: 'ekonomi',
  aliases: ['withdraw', 'tariktunai'],
  execute: (sock, msg, args, ctx) => bank.withdraw(sock, msg, args, ctx),
};
