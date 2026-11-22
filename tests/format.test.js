import test from 'node:test';
import assert from 'node:assert/strict';
import { bolusView, infusionView, verifyView } from '../scripts/format.js';

test('bolus view shows one value when min equals max', () => {
  const v = bolusView('Ketamine for RSI', 'mg', { min: 140, max: 140, minMl: 1.4, maxMl: 1.4, capped: false });
  assert.deepEqual(v, { label: 'Ketamine for RSI', dose: '140 mg', vol: '1.4 mL' });
});

test('bolus view shows a range when min differs from max', () => {
  const v = bolusView('Epinephrine', 'mcg', { min: 5, max: 20, minMl: 0.5, maxMl: 2, capped: false });
  assert.equal(v.dose, '5 – 20 mcg');
  assert.equal(v.vol, '0.5 – 2 mL');
});

test('capped bolus adds the dose cap warning to the label', () => {
  const v = bolusView('Fentanyl', 'mcg', { min: 100, max: 100, minMl: 2, maxMl: 2, capped: true });
  assert.match(v.label, /^Fentanyl \|\| .*Dose Cap/);
});

test('infusion view shows the rate range with its unit', () => {
  const v = infusionView({ min: 700, max: 5250, rateUnit: 'mcg/min' });
  assert.equal(v.rate, '700 – 5250 mcg/min');
});

test('verify view: ok gives text, no-dose gives dashes, over-max gives a warning', () => {
  assert.deepEqual(verifyView({ status: 'ok', mlHr: 21 }), { text: '21 mL/hr' });
  assert.deepEqual(verifyView({ status: 'no-dose' }), { text: '--' });
  const w = verifyView({ status: 'over-max', mlHr: 42, maxMlHr: 31.5 });
  assert.match(w.html, /42 mL\/hr exceeds guideline max of: 31\.5 mL\/hr/);
});

test('verify view: no weight asks for a weight', () => {
  assert.deepEqual(verifyView({ status: 'needs-weight' }), { text: 'Enter weight' });
});
