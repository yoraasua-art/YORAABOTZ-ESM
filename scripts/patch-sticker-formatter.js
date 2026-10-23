const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'node_modules', 'wa-sticker-formatter', 'dist', 'Sticker.js');
if (!fs.existsSync(target)) {
  console.error('wa-sticker-formatter Sticker.js tidak ditemukan setelah instalasi.');
  process.exit(1);
}

const source = fs.readFileSync(target, 'utf8');
const legacy = 'const type = yield (0, file_type_1.fromBuffer)(data);';
const compatible = 'const detectFileType = file_type_1.fileTypeFromBuffer || file_type_1.fromBuffer;\n            const type = yield detectFileType(data);';
if (source.includes(legacy)) {
  fs.writeFileSync(target, source.replace(legacy, compatible));
  console.log('Patched wa-sticker-formatter to support file-type v16/v21 API.');
} else if (source.includes('fileTypeFromBuffer') || source.includes('file_type_1.fromBuffer')) {
  console.log('wa-sticker-formatter file-type API already compatible; no patch needed.');
} else {
  console.error('API file-type dalam wa-sticker-formatter berubah; perlu audit patch manual.');
  process.exit(1);
}
