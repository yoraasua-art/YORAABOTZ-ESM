// Runtime guard for downloader stability: concurrency limit, circuit breaker,
// bounded retries with exponential backoff + jitter.
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_COOLDOWN_MS = 60 * 1000;
const queues = new Map();
const circuits = new Map();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getState(name) {
  if (!circuits.has(name)) circuits.set(name, { failures: 0, openedUntil: 0, successes: 0 });
  return circuits.get(name);
}
function isOpen(name) { return getState(name).openedUntil > Date.now(); }
function recordSuccess(name) {
  const s = getState(name); s.failures = 0; s.successes += 1; s.openedUntil = 0;
}
function recordFailure(name, cooldownMs = DEFAULT_COOLDOWN_MS) {
  const s = getState(name); s.failures += 1;
  if (s.failures >= 3) s.openedUntil = Date.now() + cooldownMs;
}
function getCircuit(name) { return { ...getState(name), open: isOpen(name) }; }

function enqueue(name, task, concurrency = DEFAULT_CONCURRENCY) {
  const key = String(name || 'download');
  const prev = queues.get(key) || Promise.resolve();
  const run = prev.catch(() => {}).then(async () => {
    // Per-provider queue. The global concurrency is represented by a shared gate.
    return task();
  });
  queues.set(key, run.finally(() => { if (queues.get(key) === run) queues.delete(key); }));
  return run;
}

let active = 0;
const waiting = [];
function acquire(concurrency = DEFAULT_CONCURRENCY) {
  if (active < concurrency) { active++; return Promise.resolve(); }
  return new Promise(resolve => waiting.push({ resolve, concurrency }));
}
function release() {
  active = Math.max(0, active - 1);
  for (let i = 0; i < waiting.length; i++) {
    if (active < waiting[i].concurrency) {
      const item = waiting.splice(i, 1)[0]; active++; item.resolve(); break;
    }
  }
}
async function runLimited(task, concurrency = DEFAULT_CONCURRENCY) {
  await acquire(concurrency);
  try { return await task(); } finally { release(); }
}

async function retryProvider(name, task, options = {}) {
  const performanceStats = require('./performance-stats');
  const retries = Math.max(0, Math.min(5, Number(options.retries ?? 2)));
  const cooldownMs = Math.max(10000, Number(options.cooldownMs ?? DEFAULT_COOLDOWN_MS));
  if (isOpen(name)) throw new Error(`Provider ${name} sedang cooldown`);
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const started = Date.now();
    try {
      const result = await runLimited(task, Number(options.concurrency || DEFAULT_CONCURRENCY));
      recordSuccess(name);
      performanceStats.recordProvider(name, Date.now() - started, true);
      return result;
    } catch (e) {
      last = e;
      performanceStats.recordProvider(name, Date.now() - started, false);
      if (e?.userFacing || attempt >= retries) { recordFailure(name, cooldownMs); throw e; }
      recordFailure(name, cooldownMs);
      const delay = Math.min(5000, 350 * (2 ** attempt)) + Math.floor(Math.random() * 250);
      await sleep(delay);
      if (isOpen(name)) throw last;
    }
  }
  throw last || new Error(`${name} gagal`);
}

function reset(name) { if (name) circuits.delete(name); else circuits.clear(); }
function getRuntimeStats() { return { active, queued: waiting.length, circuits: Object.fromEntries([...circuits].map(([k,v]) => [k, getCircuit(k)])) }; }
module.exports = { retryProvider, runLimited, reset, getCircuit, getRuntimeStats, DEFAULT_CONCURRENCY, DEFAULT_COOLDOWN_MS };
