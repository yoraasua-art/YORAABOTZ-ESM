// Downloader tambahan tanpa API key: Twitter/X, Facebook, Pinterest, Spotify (via YouTube), dan pencarian YouTube.
const dl = require('./downloader');
const { getJson, getText, request } = require('./http');

function userError(message) {
  const error = new Error(message);
  error.userFacing = true;
  return error;
}

function firstUrl(args) {
  return (args.join(' ').match(/https?:\/\/\S+/i) || [])[0] || null;
}

function hostMatches(url, hosts) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return hosts.some(item => host === item || host.endsWith(`.${item}`));
  } catch {
    return false;
  }
}

function decodeHtml(text) {
  return String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function metaContent(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  const match = html.match(pattern) || html.match(reverse);
  return match ? decodeHtml(match[1]) : null;
}

// ───────────── Twitter / X ─────────────
async function downloadTwitter(url, options = {}) {
  const match = String(url).match(/(?:twitter\.com|x\.com)\/([^/]+)\/status(?:es)?\/(\d+)/i);
  if (!match) throw userError('Link Twitter/X tidak valid. Contoh: https://x.com/user/status/123');
  try {
    const data = await dl.withRetry('fxtwitter', () => getJson(`https://api.fxtwitter.com/${match[1]}/status/${match[2]}`, {}, 20000));
    const tweet = data?.tweet;
    if (!tweet) throw new Error('Tweet tidak ditemukan atau akunnya privat.');
    const media = (tweet.media?.all || []).map(item => ({
      type: item.type === 'photo' ? 'image' : 'video',
      url: item.type === 'photo' ? item.url : (item.url || item.variants?.[0]?.url),
    })).filter(item => item.url);
    return { text: tweet.text || '', author: tweet.author?.screen_name || match[1], media };
  } catch (primaryError) {
    try {
      const result = await dl.downloadViaCobalt(url, options, 'video');
      return { text: '', author: match[1], media: [{ type: 'video', buffer: result.buffer }] };
    } catch (fallbackError) {
      throw userError(`Media X/Twitter gagal diambil: ${primaryError.message}; fallback: ${fallbackError.message}`);
    }
  }
}

// ───────────── Facebook ─────────────
async function downloadFacebook(url, options = {}) {
  const errors = [];
  try {
    const html = await getText(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html' } }, 20000);
    const patterns = [
      /"browser_native_hd_url":"([^"]+)"/, /"playable_url_quality_hd":"([^"]+)"/, /hd_src:"([^"]+)"/,
      /"browser_native_sd_url":"([^"]+)"/, /"playable_url":"([^"]+)"/, /sd_src:"([^"]+)"/,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const videoUrl = dl.unescapeJsonString(match[1]);
        const buffer = await dl.fetchBuffer(videoUrl, { maxBytes: options.maxBytes });
        return { buffer, title: metaContent(html, 'og:title') || 'Facebook Video', mimetype: 'video/mp4' };
      }
    }
    errors.push('video tidak ditemukan di halaman publik');
  } catch (error) {
    errors.push(error.message);
  }
  try {
    return await dl.downloadViaCobalt(url, options, 'video');
  } catch (error) {
    errors.push(`cobalt: ${error.message}`);
  }
  try {
    return await dl.viaYtDlp(url, 'video', options);
  } catch (error) {
    errors.push(`yt-dlp: ${error.message}`);
  }
  throw userError(`Video Facebook tidak bisa diambil (pastikan video publik). Detail: ${errors.join('; ')}`);
}

// ───────────── Pinterest ─────────────
async function resolvePinterestUrl(url) {
  if (!hostMatches(url, ['pin.it'])) return url;
  const response = await request(url, { redirect: 'follow' }, 15000);
  return response.url;
}

async function downloadPinterest(url, options = {}) {
  try {
    const finalUrl = await resolvePinterestUrl(url);
    const html = await getText(finalUrl, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }, 20000);
    const video = (html.match(/https:\/\/v1\.pinimg\.com\/videos\/[^"'\s\\]+?\.mp4/) || [])[0];
    if (video) return { type: 'video', url: video, title: metaContent(html, 'og:title') };
    const original = (html.match(/https:\/\/i\.pinimg\.com\/originals\/[^"'\s\\]+?\.(?:jpg|jpeg|png|gif|webp)/i) || [])[0];
    const image = original || metaContent(html, 'og:image');
    if (image) return { type: image.endsWith('.gif') ? 'gif' : 'image', url: image, title: metaContent(html, 'og:title') };
  } catch {}
  try {
    const result = await dl.downloadViaCobalt(url, options, 'video');
    return { type: 'video', buffer: result.buffer, title: result.title };
  } catch {}
  throw userError('Media Pinterest tidak ditemukan. Pastikan link pin publik.');
}

async function searchPinterest(query, limit = 5) {
  const data = JSON.stringify({ options: { query, scope: 'pins', page_size: 25 }, context: {} });
  const endpoint = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(`/search/pins/?q=${query}`)}&data=${encodeURIComponent(data)}`;
  const json = await getJson(endpoint, { headers: { Accept: 'application/json', 'X-Pinterest-PWS-Handler': 'www/search/[scope].js' } }, 20000);
  const results = (json?.resource_response?.data?.results || [])
    .map(pin => pin?.images?.orig?.url || pin?.images?.['736x']?.url)
    .filter(Boolean);
  if (!results.length) throw userError(`Tidak ada hasil Pinterest untuk "${query}".`);
  return results.sort(() => Math.random() - 0.5).slice(0, limit);
}

// ───────────── YouTube search ─────────────
function parseDuration(text) {
  if (!text) return 0;
  return String(text).split(/[:.]/).map(Number).reduce((total, part) => total * 60 + part, 0);
}

async function searchYouTube(query, limit = 5) {
  const html = await getText(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=id`, { headers: { 'Accept-Language': 'id-ID,id;q=0.9' } }, 20000);
  const results = [];
  const start = html.indexOf('var ytInitialData = ');
  if (start !== -1) {
    const end = html.indexOf(';</script>', start);
    try {
      const data = JSON.parse(html.slice(start + 'var ytInitialData = '.length, end));
      const walk = node => {
        if (!node || typeof node !== 'object' || results.length >= limit) return;
        if (node.videoRenderer?.videoId) {
          const video = node.videoRenderer;
          results.push({
            id: video.videoId,
            title: video.title?.runs?.map(run => run.text).join('') || 'Tanpa judul',
            duration: video.lengthText?.simpleText || '',
            seconds: parseDuration(video.lengthText?.simpleText),
            channel: video.ownerText?.runs?.[0]?.text || '',
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
          });
          return;
        }
        for (const value of Object.values(node)) walk(value);
      };
      walk(data);
    } catch { /* fallback regex */ }
  }
  if (!results.length) {
    for (const match of html.matchAll(/"videoId":"([\w-]{11})"/g)) {
      if (!results.some(item => item.id === match[1])) results.push({ id: match[1], title: query, duration: '', seconds: 0, channel: '', url: `https://www.youtube.com/watch?v=${match[1]}` });
      if (results.length >= limit) break;
    }
  }
  return results;
}

// ───────────── Spotify ─────────────
async function spotifyInfo(url) {
  if (!/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/[A-Za-z0-9]+/.test(url)) throw userError('Hanya link lagu Spotify (open.spotify.com/track/...) yang didukung.');
  const oembed = await getJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {}, 15000);
  let artist = '';
  try {
    const id = url.match(/track\/([A-Za-z0-9]+)/)[1];
    const html = await getText(`https://open.spotify.com/embed/track/${id}`, {}, 15000);
    const match = html.match(/"artists":(\[[^\]]*\])/);
    if (match) artist = JSON.parse(match[1]).map(item => item.name).filter(Boolean).join(', ');
  } catch { /* judul saja cukup */ }
  return { title: oembed.title, artist, thumbnail: oembed.thumbnail_url };
}

module.exports = {
  userError, firstUrl, hostMatches, metaContent, decodeHtml,
  downloadTwitter, downloadFacebook, downloadPinterest, resolvePinterestUrl, searchPinterest,
  searchYouTube, parseDuration, spotifyInfo,
};
