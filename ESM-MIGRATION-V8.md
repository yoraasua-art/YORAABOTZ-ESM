# YORA BOTZ v8.0.1 — ESM-first migration

## What changed

- New ESM bootstrap entry point: `index.mjs`; `npm start` uses this entry.
- Plugin loader now accepts both legacy CommonJS `.js` plugins and native ESM `.mjs` plugins.
- Added `plugins/tools/runtimeinfo.mjs` as a native ESM plugin example. It reads local runtime information only and does not require an external API.
- Added ESM plugin tests and updated audit/preflight scans to include `.mjs` files.
- Bot, package, lockfile, and config versions are aligned at `8.0.1`.

## Important migration boundary

This is a **backward-compatible, phased ESM migration**, not a claim that all 423+ legacy source files have already been rewritten to ESM. The central core and existing `.js` plugins remain CommonJS to avoid a risky all-at-once conversion; new plugins can be authored as `.mjs` using `export default { name, execute, ... }`. Existing CommonJS plugins continue to load as before.

## Dependency decision

As checked on 23 October 2026, npm lists Baileys `7.0.0-rc14` as `latest`, while `6.7.24` is tagged `legacy`. Baileys' own package page warns that v7 introduces breaking changes. This package intentionally keeps `6.7.24` in this migration build until a separate v7 adapter is implemented and the live WhatsApp, media, reconnect, and session tests pass. This avoids advertising an unverified dependency swap as production-ready.

The installed dependency ranges already include current audited versions for Pino `10.4.0`, Sharp `0.35.5`, and Transformers `4.3.1`; these are retained rather than blindly changing the lockfile. See npm references:
- https://www.npmjs.com/package/@whiskeysockets/baileys?activeTab=versions
- https://www.npmjs.com/package/pino?activeTab=versions
- https://www.npmjs.com/package/sharp?activeTab=readme
- https://www.npmjs.com/package/@huggingface/transformers?activeTab=versions

## Validate on target host

Use Node.js 22 LTS or newer compatible Node 20 release, install FFmpeg, then run:

```bash
npm ci
npm run audit:local
npm run test:esm
npm test
npm run preflight
npm start
```

Then perform a supervised live test with a dedicated WhatsApp test account: pair/login, text message, image/audio/video/document, disconnect/reconnect, and restart with saved session. Do not share the `session/` directory or credentials.


## Follow-up patch v8.0.1 (test findings)

- Fix direct PN JID mention resolution when a message key is absent.
- Notify the user when sending/converting the voice menu fails instead of only logging it.
- Align the command-list tests with the current Command Center output and owner visibility.
- Mark Emoji Mix as Premium to match the existing policy test and feature design.
- Update the menu layout test to assert the current v8 premium header rather than the older template.
- Add a postinstall compatibility patch for `wa-sticker-formatter` when `file-type` exposes `fileTypeFromBuffer` instead of the legacy `fromBuffer`.
- Improve preflight diagnostics so a missing FFmpeg binary is not incorrectly described as a missing npm install.
