# Asset URL Update — YORA BOTZ v8.0.2

Updated `config.js` asset URLs per user-provided links:
- `voiceMenuUrl`: https://www.image2url.com/r2/default/audio/1790998274876-bf11a65b-538f-42a9-bca9-ef0ee310afa5.ogg
- `voiceOwnerUrl`: https://www.image2url.com/r2/default/audio/1790998332276-f2ed502a-5594-4f02-a63a-51908936343c.ogg
- `menuImageUrl`: https://www.image2url.com/r2/default/images/1791069524565-608e4822-bc91-4574-ac6c-a7f4f480fd21.png

Validation notes:
- URL strings are configured; this does not establish that the remote hosts serve them successfully at runtime.
- A `.ogg` extension does not prove the audio codec is Opus. WhatsApp voice-note compatibility must be tested with the actual media and bot runtime.
- No live WhatsApp delivery test was performed.
