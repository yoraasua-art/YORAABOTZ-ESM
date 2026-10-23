// Pembuat sticker teks/gambar memakai sharp (SVG) + ffmpeg (animasi) + wa-sticker-formatter (exif pack).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const sharp = require('sharp');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const SIZE = 512;
const FONT = 'DejaVu Sans, Liberation Sans, Arial, sans-serif';
const MAX_TEXT = 200;

function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]))
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

function wrapText(text, maxChars) {
  const lines = [];
  for (const paragraph of String(text).split(/\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const chunks = word.length > maxChars ? word.match(new RegExp(`.{1,${maxChars}}`, 'g')) : [word];
      for (const chunk of chunks) {
        if (!line) line = chunk;
        else if ((line + ' ' + chunk).length <= maxChars) line += ' ' + chunk;
        else { lines.push(line); line = chunk; }
      }
    }
    lines.push(line);
  }
  return lines.filter((line, index) => line || index < lines.length - 1);
}

// Cari ukuran font & jumlah karakter per baris agar teks muat di kotak.
function fitText(text, width, height, { min = 28, max = 150, ratio = 0.58, lineHeight = 1.15 } = {}) {
  for (let size = max; size >= min; size -= 4) {
    const maxChars = Math.max(1, Math.floor(width / (size * ratio)));
    const lines = wrapText(text, maxChars);
    if (lines.length * size * lineHeight <= height && lines.every(line => line.length <= maxChars)) return { size, lines };
  }
  const maxChars = Math.max(1, Math.floor(width / (min * ratio)));
  return { size: min, lines: wrapText(text, maxChars).slice(0, Math.floor(height / (min * lineHeight))) };
}

function cleanText(text) {
  const value = String(text || '').trim();
  if (!value) throw new Error('Teks tidak boleh kosong.');
  if (value.length > MAX_TEXT) throw new Error(`Teks maksimal ${MAX_TEXT} karakter.`);
  return value;
}

function textSvg(text, { color = '#ffffff', stroke = '#000000', background = null, align = 'middle', padding = 40, weight = 'bold' } = {}) {
  const { size, lines } = fitText(text, SIZE - padding * 2, SIZE - padding * 2);
  const lineHeight = size * 1.15;
  const startY = (SIZE - lines.length * lineHeight) / 2 + size * 0.85;
  const x = align === 'start' ? padding : SIZE / 2;
  const spans = lines.map((line, index) => `<tspan x="${x}" y="${(startY + index * lineHeight).toFixed(1)}">${escapeXml(line)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    (background ? `<rect width="100%" height="100%" fill="${background}"/>` : '') +
    `<text font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${align}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${Math.max(2, size / 14).toFixed(1)}" paint-order="stroke" stroke-linejoin="round"` : '') +
    `>${spans}</text></svg>`;
}

async function ttpImage(text, color = '#ffffff') {
  return sharp(Buffer.from(textSvg(cleanText(text), { color }))).png().toBuffer();
}

async function bratImage(text) {
  const svg = textSvg(cleanText(text).toLowerCase(), { color: '#000000', stroke: null, background: '#ffffff', align: 'start', padding: 36, weight: 'normal' });
  return sharp(Buffer.from(svg)).blur(1.6).png().toBuffer();
}

function memeLine(text, y, anchorBottom) {
  if (!text) return '';
  const { size, lines } = fitText(text.toUpperCase(), SIZE - 30, SIZE * 0.3, { min: 26, max: 72 });
  const lineHeight = size * 1.1;
  const top = anchorBottom ? y - lines.length * lineHeight + size * 0.85 : y + size * 0.9;
  return `<text font-family="${FONT}" font-size="${size}" font-weight="bold" fill="#ffffff" text-anchor="middle" stroke="#000000" stroke-width="${(size / 9).toFixed(1)}" paint-order="stroke" stroke-linejoin="round">` +
    lines.map((line, index) => `<tspan x="${SIZE / 2}" y="${(top + index * lineHeight).toFixed(1)}">${escapeXml(line)}</tspan>`).join('') + '</text>';
}

async function memeImage(buffer, top, bottom) {
  if (!top && !bottom) throw new Error('Teks meme tidak boleh kosong.');
  const base = await sharp(buffer, { animated: false }).resize(SIZE, SIZE, { fit: 'cover' }).png().toBuffer();
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">${memeLine(top, 10, false)}${memeLine(bottom, SIZE - 14, true)}</svg>`;
  return sharp(base).composite([{ input: Buffer.from(overlay) }]).png().toBuffer();
}

const NAME_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#20c997'];

async function quoteImage({ name, text, avatar }) {
  const body = cleanText(text);
  const displayName = String(name || 'User').slice(0, 30);
  const color = NAME_COLORS[[...displayName].reduce((sum, char) => sum + char.charCodeAt(0), 0) % NAME_COLORS.length];
  const fontSize = body.length > 120 ? 24 : body.length > 50 ? 28 : 34;
  const lines = wrapText(body, Math.floor(360 / (fontSize * 0.55))).slice(0, 10);
  const bubbleWidth = Math.min(410, Math.max(180, Math.max(displayName.length * 15, ...lines.map(line => line.length * fontSize * 0.55)) + 40));
  const bubbleHeight = 70 + lines.length * fontSize * 1.25;
  const top = Math.max(10, (SIZE - bubbleHeight) / 2);
  const left = 92;
  const initial = escapeXml((displayName.match(/[\p{L}\p{N}]/u) || ['?'])[0].toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<circle cx="46" cy="${top + 36}" r="36" fill="${color}"/>` +
    `<text x="46" y="${top + 50}" font-family="${FONT}" font-size="38" font-weight="bold" fill="#fff" text-anchor="middle">${initial}</text>` +
    `<rect x="${left}" y="${top}" width="${bubbleWidth}" height="${bubbleHeight}" rx="26" fill="#1f2c34"/>` +
    `<text x="${left + 20}" y="${top + 38}" font-family="${FONT}" font-size="26" font-weight="bold" fill="${color}">${escapeXml(displayName)}</text>` +
    `<text font-family="${FONT}" font-size="${fontSize}" fill="#e9edef">` +
    lines.map((line, index) => `<tspan x="${left + 20}" y="${(top + 38 + (index + 1) * fontSize * 1.25).toFixed(1)}">${escapeXml(line)}</tspan>`).join('') +
    '</text></svg>';
  const layers = [];
  if (avatar) {
    try {
      const mask = Buffer.from('<svg width="72" height="72"><circle cx="36" cy="36" r="36"/></svg>');
      const round = await sharp(avatar).resize(72, 72).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
      layers.push({ input: round, left: 10, top: Math.round(top) });
    } catch { /* pakai inisial */ }
  }
  return sharp(Buffer.from(svg)).composite(layers).png().toBuffer();
}

function runFfmpeg(args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    execFile(process.env.FFMPEG_PATH || 'ffmpeg', args, { timeout }, (error, stdout, stderr) => {
      if (error) reject(new Error(error.code === 'ENOENT' ? 'ffmpeg tidak terpasang di server.' : (stderr || error.message).split('\n').slice(-3).join(' ')));
      else resolve();
    });
  });
}

// Animasi teks berkedip warna-warni (webp animasi).
async function attpWebp(text) {
  const value = cleanText(text);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'attp-'));
  const colors = ['#ff0000', '#ff8800', '#ffee00', '#22dd22', '#00bbff', '#3355ff', '#aa33ff', '#ff33aa'];
  try {
    for (let i = 0; i < colors.length; i++) {
      await sharp(Buffer.from(textSvg(value, { color: colors[i] }))).png().toFile(path.join(dir, `f${String(i).padStart(2, '0')}.png`));
    }
    const out = path.join(dir, 'out.webp');
    await runFfmpeg(['-y', '-framerate', '8', '-i', path.join(dir, 'f%02d.png'), '-vcodec', 'libwebp', '-loop', '0', '-lossless', '0', '-q:v', '60', '-pix_fmt', 'yuva420p', '-an', out]);
    return fs.readFileSync(out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function toSticker(buffer, { pack, author, type = StickerTypes.FULL, quality = 70 } = {}) {
  return new Sticker(buffer, { pack: pack || 'Yora Botz', author: author || '', type, quality }).toBuffer();
}

function packOf(config) {
  return { pack: config?.botName || 'Yora Botz', author: config?.ownerName || '' };
}

module.exports = {
  SIZE, escapeXml, wrapText, fitText, textSvg, ttpImage, bratImage, memeImage, quoteImage, attpWebp, toSticker, packOf, StickerTypes,
};
