// ESM-first entry point for YORA BOTZ v8.0.2.
// The existing core remains CommonJS-compatible during the phased migration.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const legacyEntry = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.js');
require(legacyEntry);
