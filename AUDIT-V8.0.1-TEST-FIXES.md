# YORA BOTZ v8.0.1 — Follow-up test fixes

## Evidence supplied from Codespaces
The user's test output reported 127 tests: 118 passed, 7 failed, 2 skipped; the dedicated ESM suite passed 2/2. Failures visible in the screenshots included the command-list assertion, downloader Premium policy for `emix`, PN mention resolution in the menu greeting, voice-menu error feedback, stale menu-layout assertions, and `wa-sticker-formatter` calling `file_type_1.fromBuffer` while the installed `file-type` exposes `fileTypeFromBuffer`.

## Changes made
- Bumped patch release to 8.0.1 and synchronized package/config/runtime versions.
- `plugins/menu/menu.js`: direct `@s.whatsapp.net` sender is accepted as a mention JID when the message key is absent; voice-note errors now notify the user and preserve menu availability.
- `config.js`: adds `emojimix` to Premium-only commands, matching the policy test that already existed.
- `test/command-policy.test.js`: aligns the expected command-list header with the current Command Center UI and runs the all-command assertion as Owner so Owner commands are expected to appear.
- `test/menu.test.js`: aligns the expected header with the current v8 OBSIDIAN LUXE layout.
- `scripts/patch-sticker-formatter.js` + package `postinstall`: patches the installed formatter to use `fileTypeFromBuffer` on newer `file-type` versions while retaining `fromBuffer` compatibility.
- `scripts/preflight.js`: reports missing npm dependencies separately from missing FFmpeg.
- Normalized source file modes to readable `0644` (directories `0755`) so static audit doesn't hit permission errors after extraction.

## Verification performed for this follow-up package
- `node scripts/audit.js`: passed; 427 JavaScript files checked, 340 plugin files, version and package lock aligned, logo found.
- `node --test test/esm-compat.test.mjs`: 2 passed, 0 failed.
- Sticker patch smoke test with the legacy API signature: passed.
- `node --check` on changed JavaScript files: passed.

## Still requires the user's Codespaces runtime
The full `npm test` suite must be rerun after `npm ci` so the actual installed dependencies and platform are tested. WhatsApp pairing, real outgoing media, API-provider-dependent plugins, and reconnect after a live socket disconnect cannot be confirmed by offline unit tests alone. FFmpeg must exist on the host if voice menu conversion is enabled.
