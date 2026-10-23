const fs = require('fs');
const path = require('path');

const stats = new Map();
const providerStats = new Map();
const PROVIDER_FILE = path.join(__dirname, '..', 'data', 'download-provider-stats.json');

function record(command, durationMs, succeeded) {
  const name = String(command || '').toLowerCase();
  if (!name) return;
  const current = stats.get(name) || { count: 0, errors: 0, totalDurationMs: 0, maxDurationMs: 0 };
  const duration = Math.max(0, Number(durationMs) || 0);
  current.count++;
  if (!succeeded) current.errors++;
  current.totalDurationMs += duration;
  current.maxDurationMs = Math.max(current.maxDurationMs, duration);
  stats.set(name, current);
}

function loadProviderStats() {
  try {
    const raw = JSON.parse(fs.readFileSync(PROVIDER_FILE, 'utf8'));
    for (const [name, value] of Object.entries(raw || {})) providerStats.set(name, value);
  } catch {}
}
function saveProviderStats() {
  try {
    const dir = path.dirname(PROVIDER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const raw = Object.fromEntries(providerStats);
    fs.writeFileSync(PROVIDER_FILE, JSON.stringify(raw, null, 2));
  } catch {}
}
function recordProvider(provider, durationMs, succeeded) {
  const name = String(provider || '').toLowerCase();
  if (!name) return;
  const current = providerStats.get(name) || { attempts: 0, successes: 0, failures: 0, totalDurationMs: 0, lastSuccessAt: 0, lastFailureAt: 0 };
  const duration = Math.max(0, Number(durationMs) || 0);
  current.attempts++;
  if (succeeded) { current.successes++; current.lastSuccessAt = Date.now(); }
  else { current.failures++; current.lastFailureAt = Date.now(); }
  current.totalDurationMs += duration;
  current.averageLatencyMs = current.totalDurationMs / current.attempts;
  current.successRate = current.successes / current.attempts;
  providerStats.set(name, current);
  if (current.attempts % 10 === 0) saveProviderStats();
}
function getProviderStats(provider) {
  return providerStats.get(String(provider || '').toLowerCase()) || { attempts: 0, successes: 0, failures: 0, totalDurationMs: 0, averageLatencyMs: null, successRate: null, lastSuccessAt: 0, lastFailureAt: 0 };
}
function getProviderScore(provider) {
  const s = getProviderStats(provider);
  if (!s.attempts) return 50;
  const success = Math.max(0, Math.min(1, Number(s.successRate ?? 0)));
  const latency = Number(s.averageLatencyMs || 5000);
  const latencyScore = Math.max(0, Math.min(1, 1 - latency / 15000));
  return Math.round((success * 0.7 + latencyScore * 0.3) * 100);
}
function getProviderStatsAll() {
  return [...providerStats.entries()].map(([provider, value]) => ({ provider, ...value, score: getProviderScore(provider) })).sort((a,b) => b.score-a.score);
}
function resetProviderStats() { providerStats.clear(); saveProviderStats(); }
function recordPlugin(plugin, durationMs, succeeded) {
  if (!plugin || plugin.category === 'download' || plugin.name === 'perf') return;
  record(plugin.name, durationMs, succeeded);
}
function getStats() {
  return [...stats.entries()].map(([command, current]) => ({ command, count: current.count, errors: current.errors, averageDurationMs: current.totalDurationMs / current.count, maxDurationMs: current.maxDurationMs })).sort((a,b) => b.averageDurationMs-a.averageDurationMs);
}
function reset() { stats.clear(); }
loadProviderStats();
module.exports = { record, recordPlugin, getStats, reset, recordProvider, getProviderStats, getProviderStatsAll, getProviderScore, resetProviderStats };
