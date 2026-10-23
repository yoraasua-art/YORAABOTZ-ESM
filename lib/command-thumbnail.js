const fs = require('fs');
const path = require('path');

const DEFAULT_IMAGE = path.join(__dirname, '..', 'assets', 'logo.jpg');
const GITHUB_URL = 'https://github.com/bangcahyo/YORABOTZNEW';
const RAW_LOGO_URL = 'https://raw.githubusercontent.com/bangcahyo/YORABOTZNEW/main/assets/logo.jpg';
const DEDUPE_WINDOW_MS = 1500;

function isPlainTextMessage(content) {
  if (!content || typeof content !== 'object' || typeof content.text !== 'string') return false;
  const mediaKeys = [
    'image', 'video', 'audio', 'document', 'sticker', 'react', 'delete',
    'contacts', 'location', 'liveLocation', 'poll', 'product', 'listMessage',
    'buttonsMessage', 'templateMessage', 'interactiveMessage', 'viewOnce',
    'forward', 'edit', 'pin', 'unpin'
  ];
  return !mediaKeys.some((key) => Object.prototype.hasOwnProperty.call(content, key));
}

function shouldUseThumbnail(ctx) {
  if (!ctx || !ctx.config) return true;
  if (ctx.config.commandThumbnail?.enabled === false) return false;
  const command = String(ctx.commandName || ctx.pluginName || '').toLowerCase();
  return command !== 'menu';
}

function buildContextInfo(content, imageBuffer) {
  const existing = content.contextInfo && typeof content.contextInfo === 'object'
    ? content.contextInfo
    : {};

  return {
    ...existing,
    externalAdReply: {
      ...(existing.externalAdReply || {}),
      title: 'YORA BOTZ',
      body: 'WhatsApp Multi-Feature Bot · GitHub',
      mediaType: 1,
      renderLargerThumbnail: true,
      showAdAttribution: false,
      sourceUrl: GITHUB_URL,
      thumbnailUrl: RAW_LOGO_URL,
      thumbnail: imageBuffer,
    },
  };
}

function createCommandSocket(sock, ctx) {
  if (!sock || typeof sock.sendMessage !== 'function') return sock;

  const configuredPath = ctx?.config?.commandThumbnail?.imagePath;
  const imagePath = configuredPath
    ? path.resolve(__dirname, '..', configuredPath)
    : DEFAULT_IMAGE;

  let imageBuffer = null;
  try {
    if (fs.existsSync(imagePath)) imageBuffer = fs.readFileSync(imagePath);
  } catch (error) {
    console.warn('⚠️ Gagal membaca thumbnail command:', error.message);
  }

  if (!imageBuffer || !shouldUseThumbnail(ctx)) return sock;

  // Mencegah satu command mengirim balasan teks identik dua kali dalam waktu singkat.
  let lastFingerprint = '';
  let lastSentAt = 0;
  let lastSendPromise = null;

  return new Proxy(sock, {
    get(target, property) {
      if (property !== 'sendMessage') {
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      return async function commandSendMessage(targetJid, content, options) {
        if (!isPlainTextMessage(content)) {
          return target.sendMessage(targetJid, content, options);
        }

        const text = content.text;
        const fingerprint = `${String(targetJid)}\n${text}`;
        const now = Date.now();
        if (fingerprint === lastFingerprint && now - lastSentAt < DEDUPE_WINDOW_MS && lastSendPromise) {
          return lastSendPromise;
        }

        lastFingerprint = fingerprint;
        lastSentAt = now;

        const message = {
          text,
          ...(content.mentions ? { mentions: content.mentions } : {}),
          contextInfo: buildContextInfo(content, imageBuffer),
        };

        // Satu pengiriman saja: thumbnail berasal dari externalAdReply.
        // Tidak ada pengiriman kedua/fallback setelah promise sukses, sehingga
        // balasan identik tidak muncul dua kali di WhatsApp.
        lastSendPromise = target.sendMessage(targetJid, message, options);
        try {
          return await lastSendPromise;
        } catch (error) {
          // Jika preview gagal, kirim balasan teks asli satu kali sebagai fallback.
          lastSendPromise = target.sendMessage(targetJid, content, options);
          return lastSendPromise;
        }
      };
    },
  });
}

module.exports = { createCommandSocket, shouldUseThumbnail };
