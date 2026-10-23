const assert = require('node:assert/strict');
const test = require('node:test');
const { readResponseLimited, renderMenu } = require('../lib/menu-layout');

test('menu response reader accepts a stream below the configured size cap', async () => {
  const response = new Response(new Uint8Array([1, 2, 3, 4]));
  const result = await readResponseLimited(response, 4);
  assert.deepEqual([...result], [1, 2, 3, 4]);
});

test('menu response reader cancels an oversized stream instead of buffering it all', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(8));
      controller.enqueue(new Uint8Array(8));
    },
    cancel() { cancelled = true; },
  });
  const response = new Response(stream);
  await assert.rejects(readResponseLimited(response, 10), /melebihi batas/);
  assert.equal(cancelled, true);
});

test('menu layout omits legacy branding without modifying URLs', () => {
  const text = renderMenu({
    botName: 'Yora Botz',
    title: 'MENU UJI',
    prefix: '.',
    sections: [{ icon: '✦', title: 'UTAMA', items: ['.menu — menu utama', 'Situs: https://example.com/path'] }],
  });
  assert.doesNotMatch(text, /OBSIDIAN LUXE/i);
  assert.match(text, /Yora Botz/);
  assert.match(text, /https:\/\/example\.com\/path/);
  assert.match(text, /`\.menu`/);
});
