import './style.css';

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
      <div class="badges"><span>Node.js runtime</span><span>Local model cache</span><span>MIT ecosystem</span></div>
    </section>
    <section class="workspace">
      <div class="controls">
        <button id="record" class="record"><span class="dot"></span><span id="record-label">Record audio</span></button>
        <label class="upload">Upload audio<input id="file" type="file" accept="audio/*,video/*" /></label>
        <label class="language">Language<select id="language"><option value="auto">Auto-detect</option><option value="arabic">العربية</option><option value="english">English</option><option value="french">Français</option><option value="spanish">Español</option><option value="portuguese">Português</option><option value="bengali">বাংলা</option><option value="hindi">हिन्दी</option><option value="urdu">اردو</option><option value="chinese">中文</option><option value="japanese">日本語</option><option value="korean">한국어</option><option value="russian">Русский</option><option value="indonesian">Bahasa Indonesia</option><option value="german">Deutsch</option><option value="turkish">Türkçe</option><option value="italian">Italiano</option></select></label>
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

async function transcribe(blob) {
  try {
    setStatus('Sending audio to the local Node.js runtime…');
    $('engine-label').textContent = 'Node.js model server';
    const selectedLanguage = $('language').value;
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'application/octet-stream', 'X-Carbon-Language': selectedLanguage },
      body: blob,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Node runtime returned ${response.status}`);
    setTranscript(result.text?.trim());
    setStatus('Done. Audio stayed inside the local Node.js runtime.');
  } catch (error) {
    console.error('Carbon Node transcription error:', error);
    setStatus(`Could not transcribe: ${error?.message || 'unknown error'}`);
    $('engine-label').textContent = 'Node engine error — retry';
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
  } catch (error) {
    const detail = error?.message || error?.name || 'unknown error';
    setStatus(`Microphone unavailable: ${detail}`);
    console.error('Carbon microphone error:', error);
  }
});
