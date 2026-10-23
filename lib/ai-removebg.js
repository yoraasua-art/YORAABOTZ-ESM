// Hapus background foto secara lokal (tanpa API key) memakai model ONNX via @huggingface/transformers.
// Model diunduh otomatis sekali (±25 MB) lalu di-cache. Ganti lewat env REMOVEBG_MODEL bila perlu.
const sharp = require('sharp');

const MODEL_ID = process.env.REMOVEBG_MODEL || 'Xenova/modnet';
const MAX_DIMENSION = 1024;
let modelPromise = null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('background-removal', MODEL_ID, { device: 'cpu', dtype: 'fp32' });
    })().catch(error => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

async function removeBackground(input) {
  const normalized = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const { RawImage } = await import('@huggingface/transformers');
  const image = await RawImage.fromBlob(new Blob([normalized], { type: 'image/png' }));
  const remover = await getModel();
  const output = await remover(image);
  const result = Array.isArray(output) ? output[0] : output;
  return sharp(Buffer.from(result.data), { raw: { width: result.width, height: result.height, channels: result.channels } }).png().toBuffer();
}

module.exports = { removeBackground, MODEL_ID };
