const assert = require('node:assert/strict');
const vm = require('node:vm');
const test = require('node:test');
const { updateConfigText, readConfigKeyFromText } = require('../lib/config-editor');

const fixture = `module.exports = {
  ownerName: 'Nama Awal',
  enabled: true,
  retryCount: 3,
  nested: {
    ownerName: 'Nama Dalam',
  },
};\n`;

test('config editor updates only exact top-level primitive entries', () => {
  const result = updateConfigText(fixture, 'ownerName', 'Nama Baru');
  assert.equal(result.success, true);
  assert.match(result.content, /  ownerName: "Nama Baru",/);
  assert.match(result.content, /    ownerName: 'Nama Dalam',/);
  assert.equal(readConfigKeyFromText(result.content, 'ownerName'), 'Nama Baru');
  assert.equal(readConfigKeyFromText(result.content, 'nested'), null);
});

test('config editor treats quote/newline payload as a string, not JavaScript code', () => {
  const payload = `Nama \'Aman\'\\path\n; globalThis.injected = true; //`;
  const result = updateConfigText(fixture, 'ownerName', payload);
  assert.equal(result.success, true);

  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(result.content, sandbox, { timeout: 1000 });
  assert.equal(sandbox.module.exports.ownerName, payload);
  assert.equal(sandbox.injected, undefined);
});

test('config editor rejects nested objects and invalid keys instead of corrupting config', () => {
  const nested = updateConfigText(fixture, 'nested', 'false');
  const invalid = updateConfigText(fixture, 'ownerName);process.exit()', 'pwned');
  assert.equal(nested.success, false);
  assert.equal(invalid.success, false);
  assert.equal(readConfigKeyFromText(fixture, 'ownerName'), 'Nama Awal');
});
