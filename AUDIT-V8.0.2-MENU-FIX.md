# YORA BOTZ v8.0.2 — Menu fallback fixes

## Fixes
- The menu image now prefers the bundled `assets/logo.jpg`, using `menuImageUrl` only as a fallback. This avoids needless failed remote-image attempts when the configured URL is expired or unreachable.
- Voice-menu conversion now falls back to sending the downloaded original audio as a regular audio message when FFmpeg is missing (`ENOENT`). A voice note (PTT/Opus) still requires FFmpeg when the source audio is not already Ogg/Opus.
- `menu text mode sends text rather than interactive content` is a passing test name, not an error. It verifies that text mode sends plain text and no interactive buttons.

## Verification
- `node --check lib/menu-layout.js`: passed
- `node --check plugins/menu/menu.js`: passed
- `node --test test/menu-mode.test.js test/esm-compat.test.mjs`: 9/9 passed
- `node scripts/audit.js`: static audit passed; 426 JavaScript files checked, 340 plugin files found.

Full runtime tests and real WhatsApp delivery still need to be checked in the deployment environment after dependencies are installed.
