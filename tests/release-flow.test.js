import test from 'node:test';
import assert from 'node:assert/strict';
import { initRelease } from '../scripts/release.js';
const tick = () => new Promise(r => setTimeout(r, 0));

function setup({ waiting }) {
  const posted = [];
  const elements = { 'update-banner': { style: {}, onclick: null }, 'version-footer': { textContent: '' } };
  const listeners = {};
  const swContainer = {
    addEventListener(type, fn) { listeners[type] = fn; },
    ready: Promise.resolve({ active: { postMessage: m => posted.push(['active', m]) } }),
    controller: {},
    register: async () => ({
      scope: '/', update() {}, waiting,
      addEventListener() {},
    }),
  };
  const deps = {
    navigator: { serviceWorker: swContainer },
    window: { addEventListener: (type, fn) => { if (type === 'load') fn(); }, location: { reload() {} } },
    document: { getElementById: id => elements[id] },
  };
  return { posted, elements, listeners, deps };
}

test('a waiting worker shows the update banner and tapping it sends skipWaiting', async () => {
  const worker = { postMessage(m) { env.posted.push(['waiting', m]); } };
  const env = setup({ waiting: worker });
  initRelease(env.deps);
  await tick();
  assert.equal(env.elements['update-banner'].style.display, 'block');
  env.elements['update-banner'].onclick();
  assert.deepEqual(env.posted.find(p => p[0] === 'waiting'), ['waiting', 'skipWaiting']);
});

test('the page asks the active worker for its version and shows the reply in the footer', async () => {
  const env = setup({ waiting: null });
  initRelease(env.deps);
  await tick();
  assert.deepEqual(env.posted.find(p => p[0] === 'active'), ['active', 'getVersion']);
  env.listeners.message({ data: { version: '3.0.10', date: '9.15 1952' } });
  assert.equal(env.elements['version-footer'].textContent, 'Version 3.0.10  |  Updated 9.15 1952');
});
