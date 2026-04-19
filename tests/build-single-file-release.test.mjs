import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildSingleFileRelease,
  collectNonceAttr,
  isLocalAsset,
  replaceAsync,
  withoutSourceMaps
} from '../scripts/build-single-file-release-lib.mjs';

test('isLocalAsset distinguishes local and remote assets', () => {
  assert.equal(isLocalAsset('main.js'), true);
  assert.equal(isLocalAsset('/styles.css'), true);
  assert.equal(isLocalAsset('https://cdn.example.com/app.js'), false);
  assert.equal(isLocalAsset('data:text/plain;base64,Zm9v'), false);
});

test('collectNonceAttr preserves nonce attribute', () => {
  assert.equal(collectNonceAttr(' defer nonce="abc123" crossorigin'), ' nonce="abc123"');
  assert.equal(collectNonceAttr(' defer crossorigin'), '');
});

test('replaceAsync replaces matches in order', async () => {
  const result = await replaceAsync('a1b2', /\d/g, async (match) => `[${match}]`);
  assert.equal(result, 'a[1]b[2]');
});

test('withoutSourceMaps removes source map annotations', () => {
  const input = 'body{}\n/*# sourceMappingURL=styles.css.map */\nconsole.log(1);\n//# sourceMappingURL=main.js.map';
  const output = withoutSourceMaps(input);
  assert.equal(output.includes('sourceMappingURL'), false);
});

test('buildSingleFileRelease emits a single inlined index.html', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'overlay-release-test-'));
  const browserDir = path.join(tempDir, 'browser');
  const releaseDir = path.join(tempDir, 'release');

  await mkdir(browserDir, { recursive: true });
  await writeFile(path.join(browserDir, 'styles.css'), 'body{color:red;}');
  await writeFile(path.join(browserDir, 'main.js'), 'console.log("hello");');
  await writeFile(
    path.join(browserDir, 'index.html'),
    '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><script src="main.js"></script></body></html>'
  );

  const releaseIndexPath = await buildSingleFileRelease({ browserDir, releaseDir });
  const releaseIndex = await readFile(releaseIndexPath, 'utf8');

  assert.equal(releaseIndex.includes('<style data-release-inline="true">'), true);
  assert.equal(releaseIndex.includes('body{color:red;}'), true);
  assert.equal(releaseIndex.includes('console.log("hello");'), true);
  assert.equal(releaseIndex.includes('href="styles.css"'), false);
  assert.equal(releaseIndex.includes('src="main.js"'), false);
});
