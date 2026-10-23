// ============================================================
//  DOWNLOADER TANPA API KEY
//  - TikTok    : tikwm.com (publik, tanpa key)  → cadangan yt-dlp
//  - YouTube   : @distube/ytdl-core (library JS) → cadangan yt-dlp
//  - Instagram : halaman embed publik            → cadangan yt-dlp
//
//  yt-dlp OPSIONAL. Kalau terpasang di server (perintah `yt-dlp`
//  atau path di env YTDLP_PATH) otomatis dipakai sebagai cadangan.
//
//  Hasil berupa { buffer } atau { url }. Pakai toMedia(x) untuk
//  dikirim lewat sock.sendMessage.
// ============================================================

// matikan cek-update ytdl-core (hanya bikin log berisik / error 403)
process.env.YTDL_NO_UPDATE = process.env.YTDL_NO_UPDATE || '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const ffmpegPath = (() => { try { return require('ffmpeg-static'); } catch { return null; } })();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const MAX_BYTES = 60 * 1024 * 1024;   // batas ukuran file yang dikirim ke WhatsApp
const MAX_YT_SECONDS = 15 * 60;       // batas durasi YouTube (15 menit)
const providers = require('./provider-manager');
const runtime = require('./download-runtime');

// ───────────────────────── util dasar ─────────────────────────

function toMedia(item) {
  if (!item) return null;
  return item.buffer ? item.buffer : { url: item.url };
}

function userError(msg) {
  const e = new Error(msg);
  e.userFacing = true;   // pesan ini aman ditampilkan langsung ke user
  return e;
}

async function fetchJson(url, options = {}, timeout = 20000) {
  const res = await fetch(url, {
    ...options,
    headers: { 'User-Agent': UA, ...(options.headers || {}) },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url, options = {}, timeout = 20000) {
  const res = await fetch(url, {
    ...options,
    headers: { 'User-Agent': UA, ...(options.headers || {}) },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchBuffer(url, { headers = {}, maxBytes = MAX_BYTES, timeout = 90000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...headers },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get('content-length') || 0);
  if (len > maxBytes) throw userError('File terlalu besar untuk dikirim lewat WhatsApp.');

  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > maxBytes) throw userError('File terlalu besar untuk dikirim lewat WhatsApp.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function streamToBuffer(stream, maxBytes = MAX_BYTES) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) {
      if (typeof stream.destroy === 'function') stream.destroy();
      throw userError('File terlalu besar untuk dikirim lewat WhatsApp.');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function getYoutubeFailureMessage(errors) {
  const details = errors.join(' | ');
  if (/sign in to confirm|not a bot/i.test(details)) {
    return 'YouTube menolak akses otomatis untuk video ini. Coba link video publik lain; API key downloader tidak dapat mengatasi blokir tersebut.';
  }
  if (/requested format is not available|format .* not available/i.test(details)) {
    return 'YouTube tidak menyediakan format yang cocok untuk video ini. Coba link video publik lain.';
  }
  if (/yt-dlp tidak terpasang/i.test(details)) {
    return 'Fallback yt-dlp belum tersedia di server. Pasang yt-dlp dan FFmpeg, lalu restart bot.';
  }
  return 'Gagal mengambil media dari YouTube. Coba link video publik lain atau ulangi beberapa saat lagi.';
}

// Unduh ke buffer; kalau gagal, kembalikan { url } supaya Baileys yang mengunduh.
async function materialize(url, headers, maxBytes = MAX_BYTES, timeout = 90000) {
  try {
    return { buffer: await fetchBuffer(url, { headers, maxBytes, timeout }), url };
  } catch (e) {
    if (e.userFacing) throw e;
    return { url };
  }
}

// ───────────────────────── retry + website fallback ─────────────────────────
function runtimeDownloadConfig() {
  const g = providers.getGlobal();
  return {
    retries: Math.max(0, Math.min(5, Number(process.env.DOWNLOAD_RETRIES ?? g.retries ?? 2))),
    timeout: Math.max(5000, Math.min(180000, Number(process.env.DOWNLOAD_TIMEOUT_MS ?? g.timeoutMs ?? 45000))),
  };
}
function getCobaltApi() { return String(process.env.COBALT_API_URL || providers.getEndpoint('cobalt') || 'https://api.cobalt.tools').replace(/\/$/, ''); }

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function withRetry(name, fn, retries = runtimeDownloadConfig().retries) {
  const g = providers.getGlobal();
  return runtime.retryProvider(name, (attempt) => fn(attempt), {
    retries,
    concurrency: Number(g.downloadConcurrency || 2),
    cooldownMs: Number(g.circuitCooldownMs || 60000),
  });
}

async function downloadViaCobalt(url, options = {}, kind = 'video') {
  const requestedFormat = String(options.format || (kind === 'audio' ? 'mp3' : 'mp4')).toLowerCase();
  const timeout = runtimeDownloadConfig().timeout;
  const quality = String(Number(options.quality) || 720);
  const bitrate = String(Number(options.bitrate) || 192);
  const body = {
    url,
    videoQuality: quality,
    audioBitrate: bitrate,
    audioFormat: requestedFormat === 'm4a' ? 'best' : (requestedFormat === 'webm' ? 'opus' : 'mp3'),
    downloadMode: kind === 'audio' ? 'audio' : 'auto',
    youtubeVideoCodec: 'h264',
    disableMetadata: true,
  };
  const response = await fetch(`${getCobaltApi()}/`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Cobalt HTTP ${response.status}`);
  if (json.status === 'error') throw new Error(json.error?.code || json.error?.message || 'Cobalt menolak permintaan');
  let target = json.url;
  if (!target && json.picker) {
    const item = json.picker.find(x => /video|audio|photo|image/i.test(String(x.type || ''))) || json.picker[0];
    target = item?.url;
  }
  if (!target) throw new Error(`Cobalt response ${json.status || 'tidak valid'}`);
  const buffer = await fetchBuffer(target, { maxBytes: options.maxBytes || MAX_BYTES, timeout: Math.max(timeout, 60000) });
  return {
    buffer,
    title: json.filename ? String(json.filename).replace(/\.[^.]+$/, '') : 'Media',
    mimetype: kind === 'audio' ? (requestedFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : (requestedFormat === 'webm' ? 'video/webm' : 'video/mp4'),
  };
}

// ───────────────────────── yt-dlp (opsional) ─────────────────────────

const YTDLP_BIN = process.env.YTDLP_PATH || 'yt-dlp';
let ytDlpAvailable = null;

function run(cmd, args, timeout) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const last = (stderr || err.message || '').toString().trim().split('\n').pop();
        return reject(new Error(last || 'perintah gagal'));
      }
      resolve(stdout.toString());
    });
  });
}

async function hasYtDlp() {
  if (ytDlpAvailable !== null) return ytDlpAvailable;
  try {
    await run(YTDLP_BIN, ['--version'], 8000);
    ytDlpAvailable = true;
  } catch {
    ytDlpAvailable = false;
  }
  return ytDlpAvailable;
}

// Unduh media lewat yt-dlp. kind: 'video' | 'audio'
async function viaYtDlp(url, kind = 'video', options = {}) {
  if (!(await hasYtDlp())) throw new Error('yt-dlp tidak terpasang');

  const tmp = os.tmpdir();
  const prefix = `yora-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const quality = Number(options.quality) || 720;
  const audioFormat = String(options.format || 'm4a').toLowerCase();
  const format = kind === 'audio'
    ? (audioFormat === 'mp3' ? 'ba/b' : 'ba[ext=m4a]/ba[acodec^=mp4a]')
    : `bv*[ext=mp4][height<=${quality}]+ba[ext=m4a]/b[ext=mp4][height<=${quality}]/bv*[height<=${quality}]+ba/b[height<=${quality}]`;

  const args = [
    '--no-playlist', '--no-warnings', '--no-progress',
    '--js-runtimes', 'node',
    '--max-filesize', `${Math.floor((options.maxBytes || MAX_BYTES) / 1024 / 1024)}M`,
    '-f', format,
    '-o', path.join(tmp, `${prefix}.%(ext)s`),
    '--print', 'title', '--no-simulate',
    ...(kind === 'video' ? ['--merge-output-format', audioFormat === 'webm' ? 'webm' : 'mp4'] : []),
    ...(kind === 'audio' && audioFormat === 'mp3' && ffmpegPath ? ['--audio-format', 'mp3', '--audio-quality', `${options.bitrate || 192}K`, '--extract-audio', '--ffmpeg-location', ffmpegPath] : []),
    url,
  ];

  const cleanup = () => {
    try {
      for (const f of fs.readdirSync(tmp)) {
        if (f.startsWith(prefix)) { try { fs.unlinkSync(path.join(tmp, f)); } catch {} }
      }
    } catch {}
  };

  try {
    const out = await run(YTDLP_BIN, args, Math.min(180000, Math.max(30000, Number(runtimeDownloadConfig().timeout) * 3)));
    const title = out.trim().split('\n')[0] || 'Media';
    const file = fs.readdirSync(tmp).find(f => f.startsWith(prefix));
    if (!file) throw new Error('file hasil yt-dlp tidak ditemukan');
    const buffer = fs.readFileSync(path.join(tmp, file));
    if (buffer.length > (options.maxBytes || MAX_BYTES)) throw userError('File melebihi batas ukuran yang dipilih.');
    return { buffer, title, mimetype: kind === 'audio' ? (audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4') : (audioFormat === 'webm' ? 'video/webm' : 'video/mp4') };
  } finally {
    cleanup();
  }
}

// Jalankan beberapa strategi berurutan; berhenti di yang pertama berhasil.
async function tryChain(label, steps) {
  const errors = [];
  const configuredSteps = providers.getChain(label === 'YT' ? 'youtube' : label === 'TT' ? 'tiktok' : label === 'IG' ? 'instagram' : label.toLowerCase(), steps);
  for (const [name, fn] of configuredSteps) {
    try {
      return await withRetry(name, fn);
    } catch (e) {
      if (e.userFacing) throw e;
      errors.push(`${name}: ${e.message}`);
    }
  }
  console.error(`[${label}] semua provider aktif gagal → ${errors.join(' | ')}`);
  if (!configuredSteps.length) throw userError(`Tidak ada provider aktif untuk ${label}. Gunakan .providerconfig untuk mengaktifkan provider.`);
  if (label === 'YT') throw userError(getYoutubeFailureMessage(errors));
  return null;
}

// ───────────────────────── YouTube ─────────────────────────

async function ytViaYtdl(url, type, options = {}) {
  const ytdl = require('@distube/ytdl-core');
  const info = await ytdl.getInfo(url);
  const d = info.videoDetails;

  if (Number(d.lengthSeconds) > MAX_YT_SECONDS) {
    throw userError(`Durasi video terlalu panjang (maks ${MAX_YT_SECONDS / 60} menit).`);
  }
  if (d.isLiveContent && Number(d.lengthSeconds) === 0) throw userError('Video live tidak bisa diunduh.');

  let format;
  if (type === 'mp3') {
    // audio m4a bisa langsung diputar WhatsApp tanpa ffmpeg
    const audios = info.formats.filter(f => f.hasAudio && !f.hasVideo && f.container === 'mp4');
    if (!audios.length) throw new Error('format audio m4a tidak tersedia');
    format = audios.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
  } else {
    // video + audio sudah menyatu (progressive), maks 720p
    const vids = info.formats
      .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4' && (f.height || 0) <= (Number(options.quality) || 720))
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    if (!vids.length) throw new Error('format video mp4 tidak tersedia');
    format = vids[0];
  }

  const stream = ytdl.downloadFromInfo(info, { format, highWaterMark: 1 << 25 });
  let buffer = await streamToBuffer(stream, options.maxBytes || MAX_BYTES);
  if (type === 'mp3' && String(options.format || 'm4a').toLowerCase() === 'mp3') {
    if (!ffmpegPath) throw new Error('FFmpeg tidak tersedia untuk konversi MP3.');
    const tmp = path.join(os.tmpdir(), `yora-audio-${Date.now()}`);
    const input = `${tmp}.m4a`; const output = `${tmp}.mp3`;
    fs.writeFileSync(input, buffer);
    try { await run(ffmpegPath, ['-y','-i',input,'-vn','-codec:a','libmp3lame','-b:a',`${options.bitrate || 192}k`,output], 90000); buffer = fs.readFileSync(output); } finally { try{fs.unlinkSync(input)}catch{} try{fs.unlinkSync(output)}catch{} }
    if (buffer.length > (options.maxBytes || MAX_BYTES)) throw userError('File melebihi batas ukuran yang dipilih.');
    return { buffer, title: d.title, mimetype: 'audio/mpeg' };
  }
  return { buffer, title: d.title, mimetype: type === 'mp3' ? 'audio/mp4' : 'video/mp4' };
}

function normalizeYouTubeUrl(input) {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw userError('Link YouTube tidak valid. Gunakan link video langsung.');
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  let videoId;
  if (host === 'youtu.be') {
    videoId = parsed.pathname.split('/').filter(Boolean)[0];
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    videoId = parsed.searchParams.get('v');
    if (!videoId) {
      videoId = parsed.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];
    }
    if (!videoId) {
      const playlistId = parsed.searchParams.get('list') || '';
      const radioPlaylist = playlistId.match(/^RD([A-Za-z0-9_-]{11})$/);
      if (radioPlaylist) videoId = radioPlaylist[1];
    }
  }

  if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  throw userError('Link playlist tidak didukung. Kirim link video YouTube langsung.');
}

async function downloadYT(url, type = 'mp4', options = {}) {
  const requestedFormat = String(options.format || type).toLowerCase();
  const kind = /^(mp3|m4a|audio)$/.test(requestedFormat) ? 'mp3' : 'mp4';
  options = { ...options, format: requestedFormat, maxBytes: options.maxBytes || MAX_BYTES };
  const videoUrl = normalizeYouTubeUrl(url);
  const result = await tryChain('YT', [
    ['ytdl-core', () => ytViaYtdl(videoUrl, kind, options)],
    ['yt-dlp', () => viaYtDlp(videoUrl, kind === 'mp3' ? 'audio' : 'video', options)],
    ['cobalt', () => downloadViaCobalt(videoUrl, options, kind === 'mp3' ? 'audio' : 'video')],
  ]);
  return result;
}

// ───────────────────────── TikTok ─────────────────────────

async function ttViaTikwm(url, options = {}) {
  let json;
  try {
    json = await fetchJson('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ url, hd: '1' }).toString(),
    });
  } catch {
    json = await fetchJson(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
  }
  if (!json || json.code !== 0 || !json.data) throw new Error(json?.msg || 'respon tikwm tidak valid');

  const d = json.data;
  const abs = u => (u && u.startsWith('/') ? `https://www.tikwm.com${u}` : u);
  const title = d.title || 'TikTok';

  // Postingan slideshow (foto)
  if (Array.isArray(d.images) && d.images.length) {
    return { images: d.images.map(abs).filter(Boolean), title };
  }

  const videoUrl = abs(d.hdplay || d.play);
  if (!videoUrl) throw new Error('link video tidak ditemukan');
  return { ...(await materialize(videoUrl, undefined, options.maxBytes || MAX_BYTES)), title };
}

async function downloadTT(url, options = {}) {
  const result = await tryChain('TT', [
    ['tikwm', () => ttViaTikwm(url, options)],
    ['yt-dlp', () => viaYtDlp(url, 'video', options)],
    ['cobalt', () => downloadViaCobalt(url, options, 'video')],
  ]);
  if (!result) throw new Error('Gagal download TikTok. Pastikan video publik lalu coba lagi.');
  return result;
}

// ───────────────────────── Instagram ─────────────────────────

function unescapeJsonString(s) {
  try { return JSON.parse(`"${s}"`); } catch { return s.replace(/\\\//g, '/').replace(/\\u0026/g, '&'); }
}

async function igViaEmbed(url, options = {}) {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) throw userError('Link Instagram tidak valid. Gunakan link post atau reel.');

  const html = await fetchText(`https://www.instagram.com/p/${m[2]}/embed/captioned/`, {
    headers: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  const items = [];
  const v = html.match(/"video_url"\s*:\s*"([^"]+)"/);
  if (v) {
    items.push({ type: 'video', ...(await materialize(unescapeJsonString(v[1]), undefined, options.maxBytes || MAX_BYTES)) });
  } else {
    const img = html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/i)
      || html.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*EmbeddedMediaImage[^"]*"/i);
    if (img) items.push({ type: 'image', ...(await materialize(img[1].replace(/&amp;/g, '&'), undefined, options.maxBytes || MAX_BYTES)) });
  }

  if (!items.length) throw new Error('media tidak ditemukan di halaman embed');
  return { items };
}

async function igViaYtDlp(url, options = {}) {
  const r = await viaYtDlp(url, 'video', options);
  return { items: [{ type: 'video', buffer: r.buffer }] };
}

async function downloadIG(url, options = {}) {
  const result = await tryChain('IG', [
    ['embed', () => igViaEmbed(url, options)],
    ['yt-dlp', () => igViaYtDlp(url, options)],
    ['cobalt', async () => ({ items: [{ type: 'video', ...(await downloadViaCobalt(url, options, 'video')) }] })],
  ]);
  if (!result) {
    throw new Error('Gagal download Instagram. Pastikan postingan publik (story & akun private tidak didukung).');
  }
  return result;
}

module.exports = {
  MAX_BYTES,
  fetchBuffer,
  downloadWithLimit: fetchBuffer,
  fetchText,
  hasYtDlp,
  viaYtDlp,
  withRetry,
  downloadViaCobalt,
  unescapeJsonString,
  downloadYT,
  downloadTT,
  downloadIG,
  getYoutubeFailureMessage,
  normalizeYouTubeUrl,
  toMedia,
  getProviderConfig: providers.getConfig,
};
