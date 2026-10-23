import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('ESM plugin exports valid metadata and execute handler', async () => {
  const url = pathToFileURL(path.join(root, 'plugins', 'tools', 'runtimeinfo.mjs')).href;
  const module = await import(url);
  const plugin = module.default;
  assert.equal(plugin.name, 'runtimeinfo');
  assert.equal(plugin.category, 'tools');
  assert.ok(Array.isArray(plugin.aliases));
  assert.equal(typeof plugin.execute, 'function');
});

test('ESM runtimeinfo command responds without external API', async () => {
  const url = pathToFileURL(path.join(root, 'plugins', 'tools', 'runtimeinfo.mjs')).href;
  const { default: plugin } = await import(url);
  let captured;
  const sock = { sendMessage: async (...args) => { captured = args; return { key: { id: 'test' } }; } };
  const msg = { key: { id: 'quoted' } };
  await plugin.execute(sock, msg, [], { from: 'chat@s.whatsapp.net', config: { prefix: '.', version: '8.0.2' } });
  assert.equal(captured[0], 'chat@s.whatsapp.net');
  assert.match(captured[1].text, /Node\.js:/);
  assert.match(captured[1].text, /RAM sistem:/);
  assert.equal(captured[2].quoted, msg);
});
