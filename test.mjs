import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Carbon browser runtime has the expected model and fallback path', () => {
  const source = fs.readFileSync('src/main.js', 'utf8');
  assert.match(source, /fetch\('\/api\/transcribe'/);
  const nodeServer = fs.readFileSync('server/node.mjs', 'utf8');
  assert.match(nodeServer, /automatic-speech-recognition/);
  assert.match(nodeServer, /CARBON_CACHE_DIR/);
  assert.match(nodeServer, /CARBON_NODE_PORT/);
  assert.doesNotMatch(source, /pipeline\(/);
  assert.match(source, /automatic-speech-recognition/);
  assert.match(source, /value="arabic"/);
  assert.match(source, /value="english"/);
});
