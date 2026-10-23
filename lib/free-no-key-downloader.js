/**
 * ============================================================================
 * MULTI-FALLBACK NO-API-KEY DOWNLOADER & TOOLS ENGINE (100% GRATIS TANPA API KEY)
 * ============================================================================
 * Mengatasi masalah fitur Download (TikTok, IG, YouTube, Play, FB, Twitter,
 * Pinterest, Spotify, MediaFire, CapCut, Google Drive) serta AI & Tools
 * yang sebelumnya gagal karena membutuhkan API Key berbayar/expired.
 */

const https = require('https');
const http = require('http');

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          ...(options.headers || {})
        },
        timeout: options.timeout || 18000
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchJson(res.headers.location, options));
        }
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (_e) {
            resolve({ rawText: raw, status: res.statusCode });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0'
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(fetchBuffer(res.headers.location));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

/**
 * 1. TIKTOK DOWNLOADER NO WATERMARK (TANPA API KEY)
 * Menggunakan TikWM Public API + Fallback Agatz/Siputzx/Vreden
 */
async function downloadTikTokNoKey(url) {
  // Primary: TikWM Free Endpoint
  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const res = await fetchJson(api);
    if (res && res.data && (res.data.play || res.data.hdplay || res.data.images)) {
      const d = res.data;
      return {
        ok: true,
        provider: 'TikWM Free',
        title: d.title || 'TikTok Video',
        author: (d.author && (d.author.nickname || d.author.unique_id)) || 'TikTok User',
        videoUrl: d.hdplay || d.play || d.wmplay,
        audioUrl: d.music || (d.music_info && d.music_info.play),
        images: Array.isArray(d.images) ? d.images : null,
        cover: d.cover
      };
    }
  } catch (_e) {}

  // Fallback 2: Siputzx / Agatz Free Public API
  const fallbacks = [
    `https://api.siputzx.my.id/api/tiktok?url=${encodeURIComponent(url)}`,
    `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`,
    `https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`
  ];
  for (const fb of fallbacks) {
    try {
      const r = await fetchJson(fb);
      const data = r.data || r.result || r;
      const videoUrl = data.no_watermark || data.nowm || data.video || data.play || (data.data && data.data.play);
      if (videoUrl) {
        return {
          ok: true,
          provider: 'Public Multi-Fallback',
          title: data.title || 'TikTok Video',
          author: data.author || 'TikTok',
          videoUrl,
          audioUrl: data.music || data.audio || null
        };
      }
    } catch (_e) {}
  }

  return { ok: false, error: 'Gagal mengunduh TikTok. Pastikan link publik dan valid.' };
}

/**
 * 2. INSTAGRAM REELS / POST / STORY DOWNLOADER (TANPA API KEY)
 */
async function downloadInstagramNoKey(url) {
  const endpoints = [
    `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`,
    `https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`,
    `https://api.vreden.my.id/api/igdownload?url=${encodeURIComponent(url)}`,
    `https://widipe.com/download/igdl?url=${encodeURIComponent(url)}`
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetchJson(ep);
      const list = r.data || r.result || [];
      const arr = Array.isArray(list) ? list : list.url ? [list] : list.media ? list.media : [];
      if (arr.length > 0) {
        const first = arr[0];
        const mediaUrl = typeof first === 'string' ? first : first.url || first.download_url || first.link;
        if (mediaUrl) {
          return {
            ok: true,
            title: 'Instagram Media',
            mediaUrl,
            allMedia: arr.map((x) => (typeof x === 'string' ? x : x.url || x.download_url)).filter(Boolean)
          };
        }
      }
    } catch (_e) {}
  }
  return { ok: false, error: 'Gagal mengambil media Instagram. Pastikan akun tidak diprivate.' };
}

/**
 * 3. YOUTUBE MP4 / MP3 & PLAY SEARCH (TANPA API KEY)
 */
async function downloadYouTubeNoKey(urlOrQuery, type = 'mp4') {
  const isUrl = /^https?:\/\//i.test(urlOrQuery);
  if (!isUrl) {
    // Play Search + Audio/Video
    const searchEndpoints = [
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/ytsearch?message=${encodeURIComponent(urlOrQuery)}`,
      `https://widipe.com/yts?query=${encodeURIComponent(urlOrQuery)}`
    ];
    for (const sep of searchEndpoints) {
      try {
        const sr = await fetchJson(sep);
        const items = sr.data || sr.result || sr.results || [];
        if (Array.isArray(items) && items.length > 0) {
          const top = items[0];
          const videoUrl = top.url || top.link || (top.videoId ? `https://youtu.be/${top.videoId}` : '');
          if (videoUrl) {
            const dl = await downloadYouTubeNoKey(videoUrl, type);
            return {
              ...dl,
              title: top.title || dl.title,
              thumbnail: top.thumbnail || top.image || dl.thumbnail,
              duration: top.timestamp || top.duration || '-',
              views: top.views || '-',
              sourceUrl: videoUrl
            };
          }
        }
      } catch (_e) {}
    }
  }

  const dlEndpoints =
    type === 'mp3'
      ? [
          `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(urlOrQuery)}`,
          `https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(urlOrQuery)}`,
          `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(urlOrQuery)}`,
          `https://widipe.com/download/ytdl?url=${encodeURIComponent(urlOrQuery)}`
        ]
      : [
          `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(urlOrQuery)}`,
          `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(urlOrQuery)}`,
          `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(urlOrQuery)}`,
          `https://widipe.com/download/ytdl?url=${encodeURIComponent(urlOrQuery)}`
        ];

  for (const ep of dlEndpoints) {
    try {
      const r = await fetchJson(ep);
      const d = r.data || r.result || r;
      const dlUrl =
        d.dl ||
        d.download ||
        d.url ||
        d.mp3 ||
        d.mp4 ||
        d.audio ||
        d.video ||
        (d.media && (d.media.mp3 || d.media.mp4));
      if (dlUrl && typeof dlUrl === 'string' && dlUrl.startsWith('http')) {
        return {
          ok: true,
          title: d.title || 'YouTube Media',
          downloadUrl: dlUrl,
          thumbnail: d.thumbnail || d.image || null
        };
      }
    } catch (_e) {}
  }

  return { ok: false, error: 'Server YouTube sedang sibuk, silakan coba link/judul lain.' };
}

/**
 * 4. FACEBOOK, TWITTER/X, PINTEREST, SPOTIFY, MEDIAFIRE, CAPCUT, GDRIVE (TANPA API KEY)
 */
async function downloadMultiPlatformNoKey(platform, urlOrQuery) {
  const p = String(platform || '').toLowerCase();
  let endpoints = [];

  if (p === 'facebook' || p === 'fb') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.vreden.my.id/api/fbdl?url=${encodeURIComponent(urlOrQuery)}`
    ];
  } else if (p === 'twitter' || p === 'x') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/twitter?url=${encodeURIComponent(urlOrQuery)}`,
      `https://widipe.com/download/twtdl?url=${encodeURIComponent(urlOrQuery)}`
    ];
  } else if (p === 'pinterest' || p === 'pin') {
    const isUrl = /^https?:\/\//i.test(urlOrQuery);
    endpoints = isUrl
      ? [
          `https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(urlOrQuery)}`,
          `https://api.agatz.xyz/api/pinsearch?message=${encodeURIComponent(urlOrQuery)}`
        ]
      : [
          `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(urlOrQuery)}`,
          `https://api.agatz.xyz/api/pinsearch?message=${encodeURIComponent(urlOrQuery)}`,
          `https://widipe.com/pinterest?query=${encodeURIComponent(urlOrQuery)}`
        ];
  } else if (p === 'spotify') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/spotify?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.vreden.my.id/api/spotify?url=${encodeURIComponent(urlOrQuery)}`
    ];
  } else if (p === 'mediafire' || p === 'mf') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(urlOrQuery)}`,
      `https://widipe.com/mediafire?link=${encodeURIComponent(urlOrQuery)}`
    ];
  } else if (p === 'capcut') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/capcut?url=${encodeURIComponent(urlOrQuery)}`
    ];
  } else if (p === 'gdrive' || p === 'drive') {
    endpoints = [
      `https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(urlOrQuery)}`,
      `https://api.agatz.xyz/api/gdrive?url=${encodeURIComponent(urlOrQuery)}`
    ];
  }

  for (const ep of endpoints) {
    try {
      const r = await fetchJson(ep);
      const d = r.data || r.result || r;
      if (Array.isArray(d) && d.length > 0) {
        const first = d[0];
        const u = typeof first === 'string' ? first : first.url || first.images_url || first.pin || first.link || first.hd || first.sd;
        if (u) return { ok: true, title: first.title || platform.toUpperCase(), url: u, list: d };
      }
      const singleUrl =
        d.url ||
        d.download ||
        d.dl ||
        d.hd ||
        d.sd ||
        d.video ||
        d.audio ||
        d.link ||
        (d.media && d.media.url);
      if (singleUrl && typeof singleUrl === 'string') {
        return {
          ok: true,
          title: d.title || d.filename || platform.toUpperCase(),
          size: d.size || d.filesize || '-',
          url: singleUrl
        };
      }
    } catch (_e) {}
  }

  return { ok: false, error: `Gagal mengunduh dari ${platform}. Pastikan URL publik dan benar.` };
}

/**
 * 5. AI CHAT, TRANSLATE, CUACA, SHORTLINK, TTS & WIKI (100% GRATIS TANPA API KEY)
 */
async function askFreeAiNoKey(prompt) {
  const endpoints = [
    `https://text.pollinations.ai/${encodeURIComponent('Jawab dalam Bahasa Indonesia yang ramah dan jelas: ' + prompt)}`,
    `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}`,
    `https://api.agatz.xyz/api/gpt4?message=${encodeURIComponent(prompt)}`,
    `https://widipe.com/openai?text=${encodeURIComponent(prompt)}`
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetchJson(ep);
      if (typeof r.rawText === 'string' && r.rawText.trim().length > 2 && !r.rawText.includes('<html')) {
        return { ok: true, answer: r.rawText.trim() };
      }
      const ans = r.data || r.result || r.message || r.answer;
      if (typeof ans === 'string' && ans.trim()) {
        return { ok: true, answer: ans.trim() };
      }
    } catch (_e) {}
  }
  return { ok: false, answer: 'Maaf, server AI gratis sedang padat. Coba ulangi beberapa detik lagi.' };
}

async function shortenUrlNoKey(longUrl) {
  try {
    const r = await fetchJson(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (r && r.rawText && r.rawText.startsWith('http')) return r.rawText.trim();
  } catch (_e) {}
  try {
    const r2 = await fetchJson(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`);
    if (r2 && r2.rawText && r2.rawText.startsWith('http')) return r2.rawText.trim();
  } catch (_e) {}
  return longUrl;
}

module.exports = {
  fetchJson,
  fetchBuffer,
  downloadTikTokNoKey,
  downloadInstagramNoKey,
  downloadYouTubeNoKey,
  downloadMultiPlatformNoKey,
  askFreeAiNoKey,
  shortenUrlNoKey
};
