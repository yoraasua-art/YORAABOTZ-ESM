const fs = require('fs');
const path = require('path');
const config = require('../config');

const root = path.join(__dirname, '..');
const sessionDir = path.join(root, config.sessionName || 'session');

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log('✅ Folder session belum ada. Siap untuk pairing baru.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(root, `${config.sessionName || 'session'}_backup_${stamp}`);
fs.renameSync(sessionDir, backupDir);
fs.mkdirSync(sessionDir, { recursive: true });

console.log('✅ Session lama diamankan ke:');
console.log(`   ${path.basename(backupDir)}`);
console.log('🔐 Session baru dibuat. Jalankan npm start untuk pairing ulang.');
