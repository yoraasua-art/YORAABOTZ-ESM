// fetch dengan batas waktu + cek status HTTP, untuk API publik tanpa key.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function request(url, options = {}, timeout = 15000) {
  const response = await fetch(url, {
    redirect: 'follow',
    ...options,
    headers: { 'User-Agent': UA, ...(options.headers || {}) },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response;
}

async function getJson(url, options, timeout) {
  return (await request(url, options, timeout)).json();
}

async function getText(url, options, timeout) {
  return (await request(url, options, timeout)).text();
}

async function getBuffer(url, { maxBytes = 15 * 1024 * 1024, timeout = 30000, ...options } = {}) {
  const response = await request(url, options, timeout);
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('File terlalu besar.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('File terlalu besar.');
    chunks.push(chunk);
  }
  return { buffer: Buffer.concat(chunks), contentType: response.headers.get('content-type') || '' };
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { UA, request, getJson, getText, getBuffer, isHttpUrl };
