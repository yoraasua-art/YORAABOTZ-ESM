const assert = require('node:assert/strict');
const test = require('node:test');
const { getCommandEntries, buildLookup, countCommands, groupByCategory } = require('../lib/command-registry');

test('command registry normalizes aliases and counts canonical commands', () => {
  const plugins = [
    { name: 'Ping', category: 'info', aliases: ['P', 'ping'], execute() {} },
    { name: 'Secret', category: 'owner', aliases: ['s'], execute() {} },
  ];
  const entries = getCommandEntries(plugins, { includeOwner: false });
  assert.deepEqual(entries.map(entry => entry.name), ['ping']);
  assert.deepEqual(entries[0].aliases, ['p']);
  assert.equal(countCommands(plugins, { includeOwner: false }), 2);
  assert.equal(buildLookup(plugins).get('p'), 'ping');
});

test('command registry groups all visible categories', () => {
  const grouped = groupByCategory([
    { name: 'z', category: 'tools', execute() {} },
    { name: 'a', category: 'game', execute() {} },
  ]);
  assert.deepEqual([...grouped.keys()].sort(), ['game', 'tools']);
  assert.equal(grouped.get('game')[0].name, 'a');
});
