// OCR (baca teks dari gambar) tanpa API key.
// 1) Pakai `tesseract` CLI bila terpasang di server (cepat, ringan).
// 2) Jika tidak ada, pakai model lokal Florence-2 via @huggingface/transformers (unduh sekali ±600 MB).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const sharp = require('sharp');

const MODEL_ID = process.env.OCR_MODEL || 'onnx-community/Florence-2-base-ft';
let modelPromise = null;
let tesseractAvailable = null;

function runTesseract(file) {
  return new Promise((resolve, reject) => {
    execFile(process.env.TESSERACT_PATH || 'tesseract', [file, 'stdout', '-l', process.env.TESSERACT_LANG || 'ind+eng'], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

async function hasTesseract() {
  if (tesseractAvailable === null) {
    tesseractAvailable = await new Promise(resolve => execFile(process.env.TESSERACT_PATH || 'tesseract', ['--version'], { timeout: 5000 }, error => resolve(!error)));
  }
  return tesseractAvailable;
}

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const T = await import('@huggingface/transformers');
      const [model, processor, tokenizer] = await Promise.all([
        T.Florence2ForConditionalGeneration.from_pretrained(MODEL_ID, {
          device: 'cpu',
          dtype: { embed_tokens: 'fp32', vision_encoder: 'fp32', encoder_model: 'q4', decoder_model_merged: 'q4' },
        }),
        T.AutoProcessor.from_pretrained(MODEL_ID),
        T.AutoTokenizer.from_pretrained(MODEL_ID),
      ]);
      return { T, model, processor, tokenizer };
    })().catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

async function viaFlorence(png) {
  const { T, model, processor, tokenizer } = await getModel();
  const image = await T.RawImage.fromBlob(new Blob([png], { type: 'image/png' }));
  const task = '<OCR_WITH_REGION>';
  const textInputs = tokenizer(processor.construct_prompts(task));
  const visionInputs = await processor(image);
  const ids = await model.generate({ ...textInputs, ...visionInputs, max_new_tokens: 512 });
  const decoded = tokenizer.batch_decode(ids, { skip_special_tokens: false })[0];
  const result = processor.post_process_generation(decoded, task, image.size)?.[task];
  const labels = (result?.labels || []).map(label => String(label).replace(/<\/?s>/g, '').trim()).filter(Boolean);
  return labels.join('\n');
}

async function recognize(input) {
  const png = await sharp(input, { limitInputPixels: 40_000_000 }).rotate()
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  if (await hasTesseract()) {
    const file = path.join(os.tmpdir(), `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
    try {
      fs.writeFileSync(file, png);
      return { text: (await runTesseract(file)).trim(), engine: 'tesseract' };
    } catch { /* lanjut ke model AI */ } finally {
      fs.rmSync(file, { force: true });
    }
  }
  return { text: (await viaFlorence(png)).trim(), engine: 'Florence-2' };
}

module.exports = { recognize, MODEL_ID };
