// Ambil media dari pesan sendiri atau pesan yang di-reply.
function quotedInfo(msg) {
  return msg?.message?.extendedTextMessage?.contextInfo || null;
}

function findMedia(msg, types) {
  const context = quotedInfo(msg);
  const quoted = context?.quotedMessage;
  for (const type of types) {
    if (quoted?.[type]) {
      return {
        type,
        media: quoted[type],
        message: {
          key: { remoteJid: msg.key?.remoteJid, id: context.stanzaId, fromMe: false, participant: context.participant },
          message: quoted,
        },
      };
    }
  }
  for (const type of types) {
    if (msg?.message?.[type]) return { type, media: msg.message[type], message: msg };
  }
  return null;
}

async function downloadFound(found, ctx, maxBytes = 20 * 1024 * 1024) {
  const buffer = await ctx.downloadMediaMessage(found.message, 'buffer', {}, { logger: console });
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Media tidak dapat dibaca.');
  if (buffer.length > maxBytes) throw new Error(`Ukuran media maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  return buffer;
}

module.exports = { quotedInfo, findMedia, downloadFound };
