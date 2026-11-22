import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBolus, computeInfusion, verifyInfusion, weightStatus } from '../scripts/dose.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !~ ${b}`);

/* ---- bolus ---- */
test('weight-based bolus scales by weight and gives volume from concentration', () => {
  const med = { concentration: 10, unit: 'mcg' };
  const protocol = { doseRange: { min: 0.5, max: 1 } };
  const r = computeBolus(med, protocol, 3);
  near(r.min, 1.5); near(r.max, 3);
  near(r.minMl, 0.15); near(r.maxMl, 0.3);
  assert.equal(r.capped, false);
});

test('absolute bolus ignores weight', () => {
  const med = { concentration: 10, unit: 'mcg' };
  const protocol = { doseRange: { absolute: true, min: 5, max: 20 } };
  const r = computeBolus(med, protocol, 123);
  near(r.min, 5); near(r.max, 20);
  near(r.minMl, 0.5); near(r.maxMl, 2);
});

test('dose cap limits both ends and flags capped', () => {
  const med = { concentration: 10, unit: 'mcg' };
  const protocol = { doseRange: { min: 0.5, max: 1, maxTotal: 20 } };
  const r = computeBolus(med, protocol, 50);
  near(r.min, 20); near(r.max, 20); near(r.maxMl, 2);
  assert.equal(r.capped, true);
});

test('dose cap that is not reached does not flag capped', () => {
  const med = { concentration: 2, unit: 'mg' };
  const protocol = { doseRange: { min: 0.3, max: 0.3, maxTotal: 30 } };
  const r = computeBolus(med, protocol, 70);
  near(r.min, 21); assert.equal(r.capped, false);
});

/* ---- infusion display ---- */
test('weight-based per-minute infusion: rate shown per minute, mL/hr per hour', () => {
  const med = { concentration: 10000, unit: 'mcg' };
  const protocol = { infusionRate: { perMinute: true, min: 10, max: 75 } };
  const r = computeInfusion(med, protocol, 70);
  near(r.min, 700); near(r.max, 5250);
  assert.equal(r.rateUnit, 'mcg/min');
  near(r.minMlHr, 4.2); near(r.maxMlHr, 31.5);
});

test('absolute infusion ignores weight', () => {
  const med = { concentration: 10, unit: 'mcg' };
  const protocol = { infusionRate: { absolute: true, min: 25, max: 200 } };
  const r = computeInfusion(med, protocol, 70);
  near(r.min, 25); near(r.max, 200);
  assert.equal(r.rateUnit, 'mcg/hr');
  near(r.minMlHr, 2.5); near(r.maxMlHr, 20);
});

test('protocol unit mcg on a mg medication converts mcg to mg', () => {
  const med = { concentration: 0.1, unit: 'mg' };
  const protocol = { unit: 'mcg', infusionRate: { perMinute: true, min: 1, max: 6 } };
  const r = computeInfusion(med, protocol, 10);
  near(r.min, 10); near(r.max, 60);
  assert.equal(r.rateUnit, 'mcg/min');
  near(r.minMlHr, 6); near(r.maxMlHr, 36);
});

/* ---- pump-rate verification ---- */
test('verify: per-minute dose converts to mL/hr', () => {
  const med = { concentration: 10000, unit: 'mcg' };
  const protocol = { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 } };
  const r = verifyInfusion(med, protocol, 70, 50);
  assert.equal(r.status, 'ok'); near(r.mlHr, 21);
});

test('verify: dose above maxRate reports over-max with the guideline mL/hr', () => {
  const med = { concentration: 10000, unit: 'mcg' };
  const protocol = { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 } };
  const r = verifyInfusion(med, protocol, 70, 100);
  assert.equal(r.status, 'over-max'); near(r.mlHr, 42); near(r.maxMlHr, 31.5);
});

test('verify: dose equal to maxRate is ok', () => {
  const med = { concentration: 10000, unit: 'mcg' };
  const protocol = { infusionRate: { perMinute: true, min: 10, max: 75, maxRate: 75 } };
  assert.equal(verifyInfusion(med, protocol, 70, 75).status, 'ok');
});

test('verify: absolute rate and mcg-on-mg conversion', () => {
  const abs = verifyInfusion({ concentration: 10, unit: 'mcg' },
    { infusionRate: { absolute: true, min: 25, max: 200, maxRate: 200 } }, 70, 50);
  near(abs.mlHr, 5);
  const conv = verifyInfusion({ concentration: 0.1, unit: 'mg' },
    { unit: 'mcg', infusionRate: { perMinute: true, min: 1, max: 6, maxRate: 6 } }, 10, 3);
  near(conv.mlHr, 18);
});

test('verify: blank, zero or negative dose gives no-dose', () => {
  const med = { concentration: 10, unit: 'mcg' };
  const protocol = { infusionRate: { absolute: true, min: 1, max: 2 } };
  for (const d of [NaN, 0, -5]) assert.equal(verifyInfusion(med, protocol, 70, d).status, 'no-dose');
});

/* ---- maximum weight ---- */
test('weightStatus compares against the profile maximum', () => {
  assert.equal(weightStatus('adult', 200), 'ok');
  assert.equal(weightStatus('adult', 200.5), 'over-max');
  assert.equal(weightStatus('geriatric', 150), 'ok');
  assert.equal(weightStatus('geriatric', 151), 'over-max');
  assert.equal(weightStatus('pediatric', 90), 'ok');
  assert.equal(weightStatus('pediatric', 91), 'over-max');
});
