const test = require('node:test');
const assert = require('node:assert/strict');
const { auditPlugins } = require('../lib/plugin-health');

test('plugin health accepts valid commands and aliases', () => {
  const result = auditPlugins([
    { name: 'menu', aliases: ['help'], execute() {} },
    { name: 'ping', aliases: ['p'], execute() {} },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.totalPlugins, 2);
  assert.equal(result.totalCommands, 4);
});

test('plugin health detects command/alias collisions', () => {
  const result = auditPlugins([
    { name: 'menu', aliases: ['help'], execute() {} },
    { name: 'ping', aliases: ['help'], execute() {} },
  ]);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.includes('bentrok alias "help"')));
});
