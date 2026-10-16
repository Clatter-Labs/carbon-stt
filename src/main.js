import { pipeline, env } from '@huggingface/transformers';
import './style.css';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = 'onnx-community/whisper-tiny';
let transcriber = null;
let recorder = null;
let chunks = [];
let startedAt = 0;

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="/">CARBON<span>/STT</span></a><div class="org">CLATTER LABS SOFTWARE</div></header>
    <section class="hero">
      <div class="eyebrow"><i></i> LOCAL INFERENCE · NO SERVER REQUIRED</div>
      <h1>Speech becomes<br><em>text.</em></h1>
      <p class="lede">A lightweight, open-weight speech-to-text runtime for the web. Your audio stays in this browser.</p>
      <div class="badges"><span>WebGPU accelerated</span><span>Whisper Tiny Multilingual</span><span>MIT ecosystem</span></div>
    </section>
    <section class="workspace">
      <div class="controls">
        <button id="record" class="record"><span class="dot"></span><span id="record-label">Record audio</span></button>
        <label class="upload">Upload audio<input id="file" type="file" accept="audio/*,video/*" /></label>
        <label class="language">Language<select id="language"><option value="auto">Auto-detect</option><option value="arabic">العربية</option><option value="english">English</option><option value="french">Français</option><option value="spanish">Español</option><option value="hindi">हिन्दी</option><option value="portuguese">Português</option><option value="german">Deutsch</option><option value="turkish">Türkçe</option></select></label>
        <div class="engine"><span class="pulse"></span><span id="engine-label">Engine idle</span></div>
      </div>
      <div class="status"><span id="status">Ready when you are.</span><span id="timer"></span></div>
      <div class="transcript-wrap"><div class="label">TRANSCRIPT <button id="copy" class="copy" disabled>Copy</button></div><div id="transcript" class="transcript empty">Your transcription will appear here.</div></div>
    </section>
    <footer><span>Carbon v0.1.0</span><span>Runs locally in your browser · <a href="https://github.com/Clatter-Labs/carbon-stt" target="_blank" rel="noreferrer">GitHub</a></span></footer>
  </main>`;

const $ = (id) => document.getElementById(id);
const setStatus = (text) => { $('status').textContent = text; };
const setTranscript = (text) => { const el = $('transcript'); el.textContent = text || 'No speech detected.'; el.classList.toggle('empty', !text); $('copy').disabled = !text; };

async function getTranscriber() {
  if (transcriber) return transcriber;
  const supportsGPU = Boolean(navigator.gpu);
  $('engine-label').textContent = supportsGPU ? 'Loading WebGPU engine…' : 'Loading WASM engine…';
  setStatus('Downloading the model once — it will be cached locally.');
  transcriber = await pipeline('automatic-speech-recognition', MODEL, { device: supportsGPU ? 'webgpu' : 'wasm', dtype: supportsGPU ? 'fp16' : 'q8' });
  $('engine-label').textContent = supportsGPU ? 'WebGPU active' : 'WASM fallback active';
  return transcriber;
}

async function transcribe(blob) {
  try {
    const pipe = await getTranscriber();
    setStatus('Transcribing locally…');
    const selectedLanguage = $('language').value;
    const output = await pipe(await blob.arrayBuffer(), { chunk_length_s: 30, stride_length_s: 5, ...(selectedLanguage === 'auto' ? {} : { language: selectedLanguage }), task: 'transcribe' });
    setTranscript(output.text.trim());
    setStatus('Done. Audio never left this device.');
  } catch (error) {
    console.error(error);
    setStatus(`Could not transcribe: ${error.message || 'unknown error'}`);
    $('engine-label').textContent = 'Engine error';
  }
}

$('file').addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (file) await transcribe(file); event.target.value = ''; });
$('copy').addEventListener('click', async () => { await navigator.clipboard.writeText($('transcript').textContent); $('copy').textContent = 'Copied'; setTimeout(() => $('copy').textContent = 'Copy', 1200); });
$('record').addEventListener('click', async () => {
  if (recorder?.state === 'recording') { recorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = []; recorder = new MediaRecorder(stream); startedAt = Date.now();
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); $('record-label').textContent = 'Record audio'; $('record').classList.remove('recording'); clearInterval(window.carbonTimer); $('timer').textContent = ''; await transcribe(new Blob(chunks, { type: recorder.mimeType })); };
    recorder.start(); $('record-label').textContent = 'Stop recording'; $('record').classList.add('recording'); setStatus('Listening… speak clearly.');
    window.carbonTimer = setInterval(() => { $('timer').textContent = `${Math.floor((Date.now() - startedAt) / 1000)}s`; }, 250);
  } catch (error) { setStatus('Microphone permission was not granted.'); console.error(error); }
});
