const DEFAULT_MAX_MB = 60;
const MAX_ALLOWED_MB = 60;
const PRESETS = {
  slow:   { quality: 360, bitrate: 96,  maxMb: 10 },
  medium: { quality: 480, bitrate: 192, maxMb: 25 },
  fast:   { quality: 720, bitrate: 320, maxMb: 50 },
};

function parseDownloadOptions(args = []) {
  const clean = [];
  const opts = { quality: null, format: null, maxMb: DEFAULT_MAX_MB, bitrate: null, preset: null };
  let presetSeen = false;
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i] || '').trim();
    const next = () => (i + 1 < args.length ? String(args[++i] || '').trim() : '');
    if (/^(?:--)?(?:preset|speed|network|koneksi)$/i.test(a)) {
      const v = next().toLowerCase();
      if (PRESETS[v]) { Object.assign(opts, PRESETS[v]); opts.preset = v; presetSeen = true; }
      else if (v) clean.push(v);
      continue;
    }
    if (!presetSeen && /^(?:slow|medium|fast|lambat|sedang|cepat)$/i.test(a)) {
      const key = { lambat:'slow', sedang:'medium', cepat:'fast' }[a.toLowerCase()] || a.toLowerCase();
      Object.assign(opts, PRESETS[key]); opts.preset = key; presetSeen = true; continue;
    }
    if (/^(?:--)?(?:quality|q)$/i.test(a)) { const v = next(); if (/^(?:144|240|360|480|720|1080)$/i.test(v)) opts.quality = Number(v); else if (v) clean.push(v); continue; }
    if (/^(?:--)?(?:format|fmt)$/i.test(a)) { const v = next().toLowerCase(); if (/^(?:mp3|m4a|mp4|webm|audio|video)$/i.test(v)) opts.format = v; else if (v) clean.push(v); continue; }
    if (/^(?:--)?(?:bitrate|kbps)$/i.test(a)) { const v = Number(next()); if ([64,96,128,160,192,256,320].includes(v)) opts.bitrate = v; continue; }
    if (/^(?:--)?(?:max|limit|size)$/i.test(a)) { const v = next().replace(/mb$/i,''); const n = Number(v); if (Number.isFinite(n) && n > 0) opts.maxMb = Math.min(MAX_ALLOWED_MB, Math.floor(n)); continue; }
    if (/^\d{3,4}p$/i.test(a)) { opts.quality = Number(a.slice(0,-1)); continue; }
    if (/^(?:mp3|m4a|mp4|webm)$/i.test(a)) { opts.format = a.toLowerCase(); continue; }
    if (/^\d{1,2}$/.test(a) && Number(a) >= 1 && Number(a) <= MAX_ALLOWED_MB) { opts.maxMb = Number(a); continue; }
    if (/^(?:64|96|128|160|192|256|320)$/.test(a)) { opts.bitrate = Number(a); continue; }
    clean.push(a);
  }
  return { url: clean[0] || null, args: clean, opts, maxBytes: opts.maxMb * 1024 * 1024 };
}

function optionsHelp(prefix='.') {
  return [
    `⚙️ *OPSI DOWNLOADER*`,
    `• ${prefix}dl <link> slow`,
    `• ${prefix}dl <link> medium`,
    `• ${prefix}dl <link> fast`,
    `• ${prefix}dl <link> --preset slow --format mp4 --max 8`,
    `• Preset slow: 360p • 96kbps • max 10MB`,
    `• Preset medium: 480p • 192kbps • max 25MB`,
    `• Preset fast: 720p • 320kbps • max 50MB`,
    `• Manual options selalu dapat menimpa preset.`,
    `• Quality: 144, 240, 360, 480, 720, 1080 (jika provider mendukung)`,
    `• Video: mp4 • Audio: m4a / mp3`,
    `• Batas maksimal manual: 1–60 MB`,
    `• Contoh: ${prefix}yt <link> fast mp4`,
    `• Contoh: ${prefix}ytmp3 <link> slow mp3 128 --max 8`,
  ].join('\n');
}

module.exports = { DEFAULT_MAX_MB, MAX_ALLOWED_MB, PRESETS, parseDownloadOptions, optionsHelp };
