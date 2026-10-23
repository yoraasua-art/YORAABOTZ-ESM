const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');
const lock = require('../package-lock.json');
const config = require('../config');
const { VERSION } = require('../lib/version');

const ROOT = path.join(__dirname, '..');
const problems = [];
let jsFiles = 0;
let pluginFiles = 0;

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) walk(absolute);
    else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.mjs'))) {
      jsFiles++;
      if (absolute.startsWith(path.join(ROOT, 'plugins') + path.sep)) pluginFiles++;
      const check = spawnSync(process.execPath, ['--check', absolute], { encoding: 'utf8' });
      if (check.status !== 0) problems.push(`Syntax error ${path.relative(ROOT, absolute)}: ${(check.stderr || check.stdout || '').trim()}`);
    }
  }
}

walk(ROOT);

if (pkg.version !== VERSION) problems.push(`Versi package.json (${pkg.version}) tidak sama dengan lib/version.js (${VERSION})`);
if (pkg.version !== config.version) problems.push(`Versi config.js (${config.version}) tidak sama dengan package.json (${pkg.version})`);
if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version) {
  problems.push('Versi package-lock.json tidak selaras dengan package.json');
}
const rootDeps = lock.packages?.['']?.dependencies || {};
for (const [name, range] of Object.entries(pkg.dependencies || {})) {
  if (rootDeps[name] !== range) problems.push(`Dependency ${name}: package.json=${range}, lock=${rootDeps[name] || 'MISSING'}`);
}
for (const name of Object.keys(rootDeps)) {
  if (!Object.hasOwn(pkg.dependencies || {}, name)) problems.push(`Dependency lockfile tidak terdaftar di package.json: ${name}`);
}

const bundledLogo = path.join(ROOT, 'assets', 'logo.jpg');
if (!fs.existsSync(bundledLogo)) problems.push('Logo assets/logo.jpg tidak ada');
if (config.commandThumbnail?.imagePath) {
  const asset = path.resolve(ROOT, config.commandThumbnail.imagePath);
  if (!fs.existsSync(asset)) problems.push(`Thumbnail command tidak ditemukan: ${path.relative(ROOT, asset)}`);
}
if (config.sendMenuAs && !['text', 'image', 'both', 'voice'].includes(config.sendMenuAs)) {
  problems.push(`sendMenuAs tidak dikenal: ${config.sendMenuAs}`);
}

console.log(`YORA BOTZ v${VERSION} AUDIT`);
console.log(`JavaScript checked: ${jsFiles}`);
console.log(`Plugin files: ${pluginFiles}`);
console.log(`Node.js: ${process.version}`);
console.log(`Logo: ${fs.existsSync(bundledLogo) ? 'OK' : 'MISSING'}`);
console.log(`Package-lock root dependencies: ${Object.keys(rootDeps).length}`);
if (problems.length) {
  console.error(`\nAUDIT ISSUES (${problems.length}):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log('Static audit passed. Full runtime tests need npm dependencies; FFmpeg is only used for voice-note conversion.');
}
