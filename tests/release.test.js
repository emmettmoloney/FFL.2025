import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const swSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const raw = vm.runInNewContext(swSource + '\n;({ CACHE_NAME, VERSION, urlsToCache })', { self: { addEventListener() {} }, console });
const sw = { CACHE_NAME: raw.CACHE_NAME, VERSION: raw.VERSION, urlsToCache: Array.from(raw.urlsToCache) };

const filesIn = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .filter(e => e.isFile() && !e.name.startsWith('.'))
  .map(e => `./${dir}/${e.name}`);

test('the cache name is built from the version, so a release is one edit', () => {
  assert.equal(sw.CACHE_NAME, `ffl-calc-v${sw.VERSION}`);
});

test('every app file is in the service worker cache list', () => {
  const expected = ['./', './index.html', './manifest.json',
    ...filesIn('scripts'), ...filesIn('data'), ...filesIn('styles'), ...filesIn('icons')];
  const missing = expected.filter(f => !sw.urlsToCache.includes(f));
  assert.deepEqual(missing, []);
});

test('the cache list names no file that does not exist', () => {
  const gone = sw.urlsToCache.filter(f => f !== './' && !fs.existsSync(path.join(root, f)));
  assert.deepEqual(gone, []);
});

test('index.html loads only scripts that exist', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
  assert.ok(srcs.length > 0);
  srcs.forEach(src => assert.ok(fs.existsSync(path.join(root, src)), src));
});

/* ---- install ---- */
function runInstall(addAll) {
  const handlers = {};
  const opened = [];
  const caches = { open: async name => { opened.push(name); return { addAll }; } };
  vm.runInNewContext(swSource, { self: { addEventListener: (t, fn) => { handlers[t] = fn; } }, caches, console: { log() {}, error() {} } });
  let installing;
  handlers.install({ waitUntil: p => { installing = p; } });
  return { installing, opened };
}

test('install succeeds when every file caches, using the versioned cache', async () => {
  let cached;
  const { installing, opened } = runInstall(async urls => { cached = Array.from(urls); });
  await installing;
  assert.deepEqual(cached, sw.urlsToCache);
  assert.deepEqual(opened, [sw.CACHE_NAME]);
});

test('install fails when any file fails to cache, so the old version stays in use', async () => {
  const { installing } = runInstall(async () => { throw new Error('offline'); });
  await assert.rejects(installing, /offline/);
});
