const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const config = require('../config');
const menu = require('../plugins/menu/menu');
const menuPicker = require('../plugins/menu/menupicker');

const from = 'test@g.us';

function makeContext(mode, overrides = {}) {
  return {
    config: {
      ...config,
      sendMenuAs: mode,
      menuImageUrl: 'https://example.invalid/menu.png',
      voiceMenuUrl: '',
      menuVoiceEnabled: false,
      ...overrides,
    },
    from,
    user: { limit: 10, money: 100, point: 0, exp: 0, registered: true },
    pushName: 'Pengguna Uji',
    sender: '628123456789@s.whatsapp.net',
    isSenderOwner: () => false,
    isPremium: () => false,
    loadDB: () => ({}),
  };
}

function makeSocket({ rejectRemoteImage = false } = {}) {
  const messages = [];
  const sock = {
    async sendMessage(_jid, message) {
      if (rejectRemoteImage && message.image?.url === 'https://example.invalid/menu.png') {
        throw new Error('Simulasi URL gambar tidak dapat diakses');
      }
      messages.push(message);
    },
  };
  return { sock, messages };
}

test('menu text mode sends text rather than interactive content', async () => {
  const { sock, messages } = makeSocket();
  await menu.execute(sock, {}, [], makeContext('text'));
  assert.equal(messages.length, 1);
  assert.equal(typeof messages[0].text, 'string');
  assert.match(messages[0].text, /MENU UTAMA/);
  assert.equal(messages[0].image, undefined);
});

test('legacy native mode safely falls back to text and sends no interactive content', async () => {
  const { sock, messages } = makeSocket();
  await menu.execute(sock, {}, [], makeContext('native'));
  assert.equal(messages.length, 1);
  assert.equal(typeof messages[0].text, 'string');
  assert.match(messages[0].text, /MENU UTAMA/);
  assert.equal(messages[0].interactive, undefined);
  assert.equal(messages[0].buttons, undefined);
});

test('unset menu mode defaults to text', async () => {
  const { sock, messages } = makeSocket();
  await menu.execute(sock, {}, [], makeContext(undefined));
  assert.equal(messages.length, 1);
  assert.equal(typeof messages[0].text, 'string');
});

test('menu image mode prefers the bundled logo over a possibly unavailable remote image', async () => {
  const { sock, messages } = makeSocket({ rejectRemoteImage: true });
  await menu.execute(sock, {}, [], makeContext('image'));
  assert.equal(messages.length, 1);
  assert.ok(messages[0].image.url.endsWith(path.join('assets', 'logo.jpg')));
  assert.equal(typeof messages[0].caption, 'string');
});

test('menu both mode sends image without waiting on voice when voice URL is absent', async () => {
  const { sock, messages } = makeSocket();
  await menu.execute(sock, {}, [], makeContext('both'));
  assert.equal(messages.length, 1);
  assert.ok(messages[0].image);
  assert.equal(messages[0].audio, undefined);
});

test('configured main menu sends an image and an Opus voice note', async () => {
  assert.equal(config.sendMenuAs, 'both');
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(
    Buffer.concat([Buffer.from('OggS'), Buffer.alloc(8), Buffer.from('OpusHead')]),
    { headers: { 'content-type': 'audio/ogg' } },
  );

  try {
    const { sock, messages } = makeSocket();
    const context = makeContext(config.sendMenuAs, {
      menuVoiceEnabled: true,
      voiceMenuUrl: 'https://example.invalid/menu-opus.ogg',
    });
    await menu.execute(sock, {}, [], context);
    assert.ok(messages.some(message => message.image), 'menu should include its thumbnail');
    assert.ok(messages.some(message => message.audio && message.ptt), 'menu should include a voice note');
    assert.ok(messages.every(message => !/OBSIDIAN LUXE/i.test(message.caption || message.text || '')));
  } finally {
    global.fetch = originalFetch;
  }
});

test('menu voice mode falls back to text if no voice URL is configured', async () => {
  const { sock, messages } = makeSocket();
  await menu.execute(sock, {}, [], makeContext('voice'));
  assert.equal(messages.length, 1);
  assert.equal(typeof messages[0].text, 'string');
});

test('category picker lists text commands and hides owner menu from regular users', async () => {
  const { sock, messages } = makeSocket();
  await menuPicker.execute(sock, {}, [], makeContext('text'));
  assert.equal(messages.length, 1);
  assert.equal(typeof messages[0].text, 'string');
  assert.match(messages[0].text, /`\.menugame`/);
  assert.doesNotMatch(messages[0].text, /`\.menuowner`/);
  assert.equal(messages[0].buttons, undefined);
  assert.equal(messages[0].interactive, undefined);
});
