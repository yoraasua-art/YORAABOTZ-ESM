const fs = require('fs');
const path = require('path');
const config = require('../config');

const CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const VALID_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

function readConfigRaw() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    return fs.readFileSync(CONFIG_PATH, 'utf-8');
  } catch {
    return null;
  }
}

// Config editing is deliberately limited to one-line, top-level primitive values.
// Avoid evaluating user-supplied JavaScript or accidentally matching nested keys.
function findTopLevelEntry(content, key) {
  if (typeof key !== 'string' || !VALID_KEY.test(key)) return null;
  const linePattern = new RegExp(`^ {2}(${key}\\s*:\\s*)(.*?)(,?)(\\s*(?:\\/\\/.*)?)$`, 'm');
  const match = linePattern.exec(content);
  if (!match) return null;
  const lineStart = content.lastIndexOf('\n', match.index) + 1;
  const prefix = match[1];
  const rawValue = match[2].trim();
  const suffix = `${match[3]}${match[4]}`;
  const valueStart = lineStart + 2 + prefix.length;
  const valueEnd = valueStart + match[2].length;
  return { match, lineStart, prefix, rawValue, suffix, valueStart, valueEnd };
}

function parsePrimitive(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value || value === '{' || value === '[' || value.startsWith('{') || value.startsWith('[')) {
    return { ok: false };
  }
  if (value === 'true') return { ok: true, value: true };
  if (value === 'false') return { ok: true, value: false };
  if (value === 'null') return { ok: true, value: null };
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) {
    const number = Number(value);
    return Number.isFinite(number) ? { ok: true, value: number } : { ok: false };
  }
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? { ok: true, value: parsed } : { ok: false };
    } catch {
      return { ok: false };
    }
  }
  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'")) return { ok: false };
    // Decode the small escape set used by the existing config file; never evaluate it.
    const inner = value.slice(1, -1);
    let result = '';
    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];
      if (char !== '\\') {
        result += char;
        continue;
      }
      const next = inner[++i];
      if (next === undefined) return { ok: false };
      const escapes = { "'": "'", '"': '"', '\\': '\\', n: '\n', r: '\r', t: '\t' };
      if (Object.prototype.hasOwnProperty.call(escapes, next)) result += escapes[next];
      else result += `\\${next}`;
    }
    return { ok: true, value: result };
  }
  return { ok: false };
}

function readConfigKeyFromText(content, key) {
  const entry = findTopLevelEntry(content, key);
  if (!entry) return null;
  const parsed = parsePrimitive(entry.rawValue);
  if (!parsed.ok) return null;
  return parsed.value === null ? 'null' : String(parsed.value);
}

function readConfigKey(key) {
  const content = readConfigRaw();
  return content === null ? null : readConfigKeyFromText(content, key);
}

function serializeInput(value) {
  const text = String(value);
  if (text === 'true') return 'true';
  if (text === 'false') return 'false';
  if (text === 'null') return 'null';
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text)) {
    const number = Number(text);
    if (Number.isFinite(number)) return String(number);
  }
  // JSON string quoting escapes quotes, slashes and newlines safely in JavaScript too.
  return JSON.stringify(text);
}

function updateConfigText(content, key, value) {
  const entry = findTopLevelEntry(content, key);
  if (!entry) return { success: false, error: `Key "${key}" tidak ditemukan atau bukan key level utama` };
  if (!parsePrimitive(entry.rawValue).ok) {
    return { success: false, error: `Key "${key}" bukan nilai sederhana; ubah langsung di config.js` };
  }
  const serialized = serializeInput(value);
  const updated = `${content.slice(0, entry.valueStart)}${serialized}${content.slice(entry.valueEnd)}`;
  return { success: true, content: updated };
}

function updateConfigKey(key, value) {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const result = updateConfigText(content, key, value);
    if (!result.success) return result;

    const mode = fs.statSync(CONFIG_PATH).mode;
    const temporaryPath = `${CONFIG_PATH}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporaryPath, result.content, { encoding: 'utf-8', mode });
      fs.renameSync(temporaryPath, CONFIG_PATH);
    } catch (error) {
      try { fs.unlinkSync(temporaryPath); } catch {}
      throw error;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listConfigKeys() {
  const content = readConfigRaw();
  if (content === null) return [];
  const regex = /^ {2}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
  const keys = [];
  let match;
  while ((match = regex.exec(content)) !== null) keys.push(match[1]);
  return [...new Set(keys)];
}

function reloadConfig() {
  try {
    delete require.cache[require.resolve('../config')];
    const newConfig = require('../config');
    for (const key of Object.keys(newConfig)) config[key] = newConfig[key];
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  readConfigRaw,
  updateConfigKey,
  readConfigKey,
  listConfigKeys,
  reloadConfig,
  CONFIG_PATH,
  // Export pure helpers so their security behavior can be tested without touching config.js.
  updateConfigText,
  readConfigKeyFromText,
};
