# YORA BOTZ v8.0.0 — ESM Migration Audit

Date: 23 October 2026

## Implemented
- ESM bootstrap `index.mjs`; `npm start` now uses it.
- Backward-compatible plugin loader accepts `.mjs` ESM plugins and `.js` CommonJS plugins.
- Added `plugins/tools/runtimeinfo.mjs` (`.runtimeinfo`, aliases `.nodeinfo` and `.runtime`) with local-only runtime diagnostics.
- Added two ESM tests and included `.mjs` files in audit/preflight scans.
- Version synchronized to `8.0.0` across package metadata, lockfile, config and runtime version module.

## Validation
- `node --check` passed for changed JS/MJS files.
- `npm run test:esm`: 2 passed, 0 failed.
- `npm run audit:local`: passed; 426 JS/MJS files scanned and 340 plugin files detected.
- Full `npm test`: 81 tests passed; 7 failures. Most failures in this environment are due to missing installed dependencies (`@whiskeysockets/baileys`, `wa-sticker-formatter`); one stale assertion was updated to v8.0.0 after this run. Rerun after `npm ci`.
- Live WhatsApp pairing, media delivery and reconnect recovery have not been testable from this environment.

## Migration scope and risk
This is an ESM-first phased migration, not a complete conversion of all legacy source files. Existing CommonJS core/plugins are retained to avoid mass conversion risks; newly written plugins can use native ESM. Baileys remains `6.7.24` until the breaking changes in `7.0.0-rc14` are migrated and live integration tests pass. npm currently lists `7.0.0-rc14` as latest and warns of breaking changes: https://www.npmjs.com/package/@whiskeysockets/baileys?activeTab=versions

See `ESM-MIGRATION-V8.md` for deployment validation steps.
