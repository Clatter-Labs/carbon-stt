import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Carbon browser runtime has the expected model and fallback path', () => {
  const source = fs.readFileSync('src/main.js', 'utf8');
  assert.match(source, /onnx-community\/whisper-tiny/);
  assert.match(source, /device: supportsGPU \? 'webgpu' : 'wasm'/);
  assert.match(source, /automatic-speech-recognition/);
  assert.match(source, /value="arabic"/);
  assert.match(source, /value="english"/);
});
