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

test('verify view: ok gives text, no-dose asks for a dose, over-max gives a warning', () => {
  assert.deepEqual(verifyView({ status: 'ok', mlHr: 21 }), { text: '21 mL/hr' });
  assert.deepEqual(verifyView({ status: 'no-dose' }), { text: 'Enter dose' });
  const w = verifyView({ status: 'over-max', mlHr: 42, maxMlHr: 31.5 });
  assert.match(w.html, /42 mL\/hr exceeds guideline max of: 31\.5 mL\/hr/);
});

test('verify view: no weight asks for a weight', () => {
  assert.deepEqual(verifyView({ status: 'needs-weight' }), { text: 'Enter weight' });
});

/* ---- rounding: doses to 3 decimals, volumes and mL/hr to 2 ---- */
test('a dose is shown as written: 0.625 mg stays 0.625 mg', () => {
  const v = bolusView('Droperidol', 'mg', { min: 0.625, max: 1.25, minMl: 0.25, maxMl: 0.5, capped: false });
  assert.equal(v.dose, '0.625 – 1.25 mg');
  assert.equal(v.vol, '0.25 – 0.5 mL');
});

test('floating point noise is removed from doses', () => {
  const v = bolusView('X', 'mg', { min: 21.000000000000004, max: 21.000000000000004, minMl: 0.21, maxMl: 0.21, capped: false });
  assert.equal(v.dose, '21 mg');
});

test('volumes are rounded to 2 decimals', () => {
  const v = bolusView('X', 'mg', { min: 1, max: 1, minMl: 0.123456, maxMl: 0.123456, capped: false });
  assert.equal(v.vol, '0.12 mL');
});

test('an infusion rate keeps 3 decimals and mL/hr keeps 2', () => {
  assert.equal(infusionView({ min: 0.625, max: 1.5, rateUnit: 'mg/hr' }).rate, '0.625 – 1.5 mg/hr');
  assert.deepEqual(verifyView({ status: 'ok', mlHr: 4.23456 }), { text: '4.23 mL/hr' });
});
