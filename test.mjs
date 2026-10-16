import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Carbon browser runtime delegates audio to the Node model server', () => {
  const source = fs.readFileSync('src/main.js', 'utf8');
  assert.match(source, /fetch\('\/api\/transcribe'/);
  assert.match(source, /Node\.js model server/);
  assert.doesNotMatch(source, /pipeline\(/);
  assert.match(source, /value="arabic"/);
  assert.match(source, /value="english"/);
});

test('Carbon Node runtime owns model loading and model cache', () => {
  const source = fs.readFileSync('server/node.mjs', 'utf8');
  assert.match(source, /automatic-speech-recognition/);
  assert.match(source, /CARBON_CACHE_DIR/);
  assert.match(source, /CARBON_NODE_PORT/);
  assert.match(source, /ffmpeg-static/);
  assert.match(source, /16000/);
});
