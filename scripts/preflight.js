const fs = require('fs');
const path = require('path');
const { spawnSync } = require('node:child_process');
const { VERSION } = require('../lib/version');
const config = require('../config');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const required = Object.keys(pkg.dependencies || {});
const failures = [];
const missingDependencies = [];
const environmentWarnings = [];

for (const dependency of required) {
  try { require.resolve(dependency, { paths: [root] }); }
  catch { missingDependencies.push(dependency); }
}

const pluginRoot = path.join(root, 'plugins');
let pluginFiles = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) pluginFiles++;
  }
}
walk(pluginRoot);

const ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static') || 'ffmpeg';
const ffmpeg = spawnSync(ffmpegPath, ['-version'], { stdio: 'ignore' }).status === 0;
const voiceMenuActive = ['voice', 'both'].includes(config.sendMenuAs)
  && config.menuVoiceEnabled !== false
  && Boolean(config.voiceMenuUrl);
if (!ffmpeg) {
  environmentWarnings.push(voiceMenuActive
    ? 'FFmpeg tidak tersedia; voice menu dapat gagal jika sumber audio perlu dikonversi, tetapi menu tetap memiliki fallback teks.'
    : 'FFmpeg tidak tersedia; fitur voice belum aktif pada mode menu saat ini, jadi menu teks/gambar tetap bisa berjalan.');
}
failures.push(...missingDependencies.map(name => `dependency belum tersedia: ${name}`));

console.log(`YORA BOTZ v${VERSION} PREFLIGHT`);
console.log(`Plugins: ${pluginFiles}`);
console.log(`Node: ${process.version}`);
console.log(`FFmpeg: ${ffmpeg ? 'OK' : 'MISSING (opsional untuk mode teks/gambar)'}`);
if (failures.length) {
  console.error('\nATTENTION:');
  for (const failure of failures) console.error(`- ${failure}`);
  if (missingDependencies.length) console.error('\nJalankan npm ci untuk memasang dependency yang hilang.');
  process.exitCode = 1;
} else {
  console.log('All required npm dependencies are available.');
}
if (environmentWarnings.length) {
  console.warn('\nOPTIONAL FEATURES:');
  for (const warning of environmentWarnings) console.warn(`- ${warning}`);
}
