const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'download-providers.json');
const HEALTH_TTL_MS = 60 * 1000;
const HEALTH_INTERVAL_MS = 5 * 60 * 1000;
const HEALTH_CONCURRENCY = 3;
const performanceStats = require('./performance-stats');

const DEFAULT_CONFIG = {
  version: 2,
  global: { timeoutMs: 45000, retries: 2, healthIntervalMs: HEALTH_INTERVAL_MS, downloadConcurrency: 2, circuitCooldownMs: 60000, smartSelection: true },
  providers: {
    'ytdl-core': { enabled: true, type: 'local', label: 'Distube ytdl-core' },
    'yt-dlp': { enabled: true, type: 'local', label: 'yt-dlp' },
    cobalt: { enabled: true, type: 'website', label: 'Cobalt', endpoint: 'https://api.cobalt.tools' },
    tikwm: { enabled: true, type: 'website', label: 'TikWM', endpoint: 'https://www.tikwm.com' },
    'instagram-embed': { enabled: true, type: 'website', label: 'Instagram Embed', endpoint: 'https://www.instagram.com' },
  },
  chains: {
    youtube: ['ytdl-core', 'yt-dlp', 'cobalt'],
    tiktok: ['tikwm', 'yt-dlp', 'cobalt'],
    instagram: ['instagram-embed', 'yt-dlp', 'cobalt'],
  },
};

function clone(v) { return JSON.parse(JSON.stringify(v)); }

const healthCache = new Map();
let healthTimer = null;

function healthEntry(name) {
  return healthCache.get(name) || { status: 'unknown', latencyMs: null, checkedAt: 0, detail: 'Belum dicek' };
}

function classify(statusCode, latencyMs) {
  if (statusCode === 'timeout') return { status: 'degraded', detail: 'Timeout' };
  if (statusCode === 'network') return { status: 'unavailable', detail: 'Tidak dapat terhubung' };
  if (statusCode >= 500) return { status: 'degraded', detail: `HTTP ${statusCode}` };
  if (statusCode === 429) return { status: 'degraded', detail: 'HTTP 429 (rate limit)' };
  if (statusCode >= 200 && statusCode < 500) return { status: latencyMs > 4000 ? 'degraded' : 'healthy', detail: `HTTP ${statusCode}` };
  return { status: 'unavailable', detail: `HTTP ${statusCode}` };
}

async function checkProvider(name, options = {}) {
  const c = load();
  const p = c.providers[name];
  const started = Date.now();
  if (!p) return { name, status: 'unavailable', latencyMs: 0, checkedAt: Date.now(), detail: 'Provider tidak dikenal' };
  if (p.enabled === false) return { name, status: 'disabled', latencyMs: 0, checkedAt: Date.now(), detail: 'Dinonaktifkan' };
  try {
    if (p.type === 'local') {
      if (name === 'yt-dlp') {
        const { execFile } = require('child_process');
        const bin = process.env.YTDLP_PATH || 'yt-dlp';
        await new Promise((resolve, reject) => execFile(bin, ['--version'], { timeout: Math.min(10000, c.global.timeoutMs) }, err => err ? reject(err) : resolve()));
      } else if (name === 'ytdl-core') {
        require.resolve('@distube/ytdl-core');
      } else {
        require.resolve(name);
      }
      const latencyMs = Date.now() - started;
      return { name, status: latencyMs > 4000 ? 'degraded' : 'healthy', latencyMs, checkedAt: Date.now(), detail: 'Tersedia di server' };
    }
    if (!p.endpoint) throw new Error('Endpoint tidak dikonfigurasi');
    const timeout = Math.max(3000, Math.min(15000, Number(options.timeoutMs || c.global.timeoutMs || 8000)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetch(p.endpoint, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'YORA-BOTZ-Provider-Health/1.0' }, signal: controller.signal });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(p.endpoint, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'YORA-BOTZ-Provider-Health/1.0', Accept: 'application/json,text/plain,*/*' }, signal: controller.signal });
      }
    } finally { clearTimeout(timer); }
    const latencyMs = Date.now() - started;
    const result = classify(response.status, latencyMs);
    return { name, ...result, latencyMs, checkedAt: Date.now() };
  } catch (e) {
    const latencyMs = Date.now() - started;
    const aborted = e?.name === 'AbortError' || /timeout/i.test(String(e?.message));
    return { name, status: aborted ? 'degraded' : 'unavailable', latencyMs, checkedAt: Date.now(), detail: aborted ? 'Timeout' : (e?.message || 'Error koneksi') };
  }
}

async function checkAllHealth(options = {}) {
  const c = load();
  const names = Object.keys(c.providers);
  const results = [];
  for (let i = 0; i < names.length; i += HEALTH_CONCURRENCY) {
    const batch = names.slice(i, i + HEALTH_CONCURRENCY);
    results.push(...await Promise.all(batch.map(name => checkProvider(name, options))));
  }
  for (const result of results) healthCache.set(result.name, result);
  return Object.fromEntries(results.map(r => [r.name, r]));
}

function getHealth(name) { return healthEntry(name); }
function getHealthStatus(name) { return healthEntry(name).status; }
function shouldUseProvider(name) {
  const h = healthEntry(name);
  return h.status !== 'unavailable' && h.status !== 'disabled';
}

function startHealthChecks() {
  if (healthTimer) return;
  const interval = Math.max(30000, Number(load().global.healthIntervalMs || HEALTH_INTERVAL_MS));
  checkAllHealth().catch(() => {});
  healthTimer = setInterval(() => checkAllHealth().catch(() => {}), interval);
  if (typeof healthTimer.unref === 'function') healthTimer.unref();
}

function stopHealthChecks() { if (healthTimer) clearInterval(healthTimer); healthTimer = null; }
function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
}
function load() {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return merge(DEFAULT_CONFIG, raw);
  } catch {
    return clone(DEFAULT_CONFIG);
  }
}
function merge(base, extra) {
  const out = clone(base);
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') out[k] = { ...out[k], ...v };
    else out[k] = v;
  }
  return out;
}
function save(config) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
  return config;
}
function getConfig() { return load(); }
function getGlobal() { const c = load(); return c.global; }
function isEnabled(name) { return load().providers[name]?.enabled !== false; }
function getEndpoint(name) { return load().providers[name]?.endpoint || ''; }
function getChain(platform, steps) {
  const c = load();
  const order = Array.isArray(c.chains[platform]) ? c.chains[platform] : steps.map(x => x[0]);
  const map = new Map(steps);
  const available = order.filter(name => {
    if (!map.has(name) || c.providers[name]?.enabled === false) return false;
    const h = healthEntry(name);
    if (h.status === 'unavailable') return false;
    return true;
  });
  if (c.global.smartSelection === false) return available.map(name => [name, map.get(name)]);
  const configuredRank = new Map(available.map((name, i) => [name, i]));
  available.sort((a, b) => {
    const ha = healthEntry(a), hb = healthEntry(b);
    const healthRank = { healthy: 0, degraded: 1, unknown: 2, disabled: 3, unavailable: 4 };
    const hr = (healthRank[ha.status] ?? 2) - (healthRank[hb.status] ?? 2);
    if (hr) return hr;
    const sa = performanceStats.getProviderScore(a), sb = performanceStats.getProviderScore(b);
    if (sa !== sb) return sb - sa;
    const la = Number(ha.latencyMs || 999999), lb = Number(hb.latencyMs || 999999);
    if (la !== lb) return la - lb;
    return configuredRank.get(a) - configuredRank.get(b);
  });
  return available.map(name => [name, map.get(name)]);
}
function setProvider(name, enabled) {
  const c = load();
  if (!c.providers[name]) throw new Error(`Provider tidak dikenal: ${name}`);
  c.providers[name].enabled = Boolean(enabled);
  save(c);
  return c;
}
function setGlobal(key, value) {
  const c = load();
  if (!['timeoutMs', 'retries', 'healthIntervalMs', 'downloadConcurrency', 'circuitCooldownMs', 'smartSelection'].includes(key)) throw new Error('Config global tidak dikenal.');
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Nilai harus berupa angka.');
  if (key === 'timeoutMs') c.global.timeoutMs = Math.min(180000, Math.max(5000, Math.round(n)));
  else if (key === 'retries') c.global.retries = Math.min(5, Math.max(0, Math.round(n)));
  else if (key === 'healthIntervalMs') c.global.healthIntervalMs = Math.min(3600000, Math.max(30000, Math.round(n)));
  else if (key === 'downloadConcurrency') c.global.downloadConcurrency = Math.min(5, Math.max(1, Math.round(n)));
  else if (key === 'circuitCooldownMs') c.global.circuitCooldownMs = Math.min(900000, Math.max(10000, Math.round(n)));
  else c.global.smartSelection = Boolean(n);
  stopHealthChecks();
  save(c);
  return c;
}
function setEndpoint(name, endpoint) {
  const c = load();
  if (!c.providers[name]) throw new Error(`Provider tidak dikenal: ${name}`);
  if (typeof endpoint !== 'string' || !/^https?:\/\//i.test(endpoint)) throw new Error('Endpoint harus berupa URL http/https.');
  c.providers[name].endpoint = endpoint.replace(/\/$/, '');
  save(c);
  return c;
}
function setChain(platform, names) {
  const c = load();
  if (!c.chains[platform]) throw new Error(`Platform tidak dikenal: ${platform}`);
  if (!Array.isArray(names) || !names.length) throw new Error('Prioritas provider tidak boleh kosong.');
  const unknown = names.filter(n => !c.providers[n]);
  if (unknown.length) throw new Error(`Provider tidak dikenal: ${unknown.join(', ')}`);
  c.chains[platform] = [...new Set(names)];
  save(c);
  return c;
}
function reset() { stopHealthChecks(); healthCache.clear(); save(clone(DEFAULT_CONFIG)); startHealthChecks(); return getConfig(); }

startHealthChecks();

module.exports = { FILE, DEFAULT_CONFIG, getConfig, getGlobal, isEnabled, getEndpoint, getChain, setProvider, setGlobal, setEndpoint, setChain, reset, checkProvider, checkAllHealth, getHealth, getHealthStatus, shouldUseProvider, startHealthChecks, stopHealthChecks, HEALTH_INTERVAL_MS };
