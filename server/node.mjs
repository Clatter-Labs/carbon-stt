import http from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pipeline, env } from '@huggingface/transformers';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.CARBON_NODE_PORT || 8787);
const modelId = process.env.CARBON_MODEL || 'onnx-community/whisper-tiny';
env.cacheDir = process.env.CARBON_CACHE_DIR || path.join(root, '.carbon-cache');
env.allowLocalModels = true;
env.allowRemoteModels = true;

let transcriberPromise;
function getTranscriber() {
  transcriberPromise ||= pipeline('automatic-speech-recognition', modelId, { device: 'wasm', dtype: 'q8' });
  return transcriberPromise;
}

function readBody(request, limit = 100 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(new Error('Audio upload exceeds 100 MB.')); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function decodeWithFfmpeg(inputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(process.env.FFMPEG_PATH || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', inputPath, '-f', 'f32le', '-ac', '1', '-ar', '16000', 'pipe:1']);
    const chunks = [];
    let stderr = '';
    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => code === 0 ? resolve(new Float32Array(Buffer.concat(chunks).buffer, Buffer.concat(chunks).byteOffset, Math.floor(Buffer.concat(chunks).byteLength / 4))) : reject(new Error(stderr || `ffmpeg exited with ${code}`)));
  });
}

async function transcribe(request, response) {
  const body = await readBody(request);
  const extension = (request.headers['content-type'] || '').includes('wav') ? '.wav' : '.audio';
  const inputPath = path.join(os.tmpdir(), `carbon-${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`);
  await fs.writeFile(inputPath, body);
  try {
    const audio = await decodeWithFfmpeg(inputPath);
    const language = request.headers['x-carbon-language'];
    const options = { chunk_length_s: 30, stride_length_s: 5, task: 'transcribe' };
    if (language && language !== 'auto') options.language = language;
    const output = await (await getTranscriber())(audio, options);
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ...output, model: modelId, runtime: 'node' }));
  } finally {
    await fs.rm(inputPath, { force: true });
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', runtime: 'node', model: modelId, cacheDir: env.cacheDir }));
    return;
  }
  if (request.method === 'POST' && request.url === '/api/transcribe') {
    try { await transcribe(request, response); } catch (error) { response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: error.message })); }
    return;
  }
  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, '127.0.0.1', () => console.log(`Carbon Node runtime listening on http://127.0.0.1:${port} (model: ${modelId})`));
