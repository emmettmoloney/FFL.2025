import test from 'node:test';
import assert from 'node:assert/strict';
import { protocolFor, entriesFor, validateRegistry } from '../scripts/registry.js';
import { MEDICATIONS } from '../data/medications.js';

const SECTIONS = ['supportive-body', 'induction-body', 'paralytic-body', 'pain-body', 'sedation-body',
  'vent-bolus-body', 'vent-inf-body', 'seizures-first-body', 'seizures-second-body', 'seizures-third-body'];

const good = () => ({
  section: ['pain-body'], concentration: 10, unit: 'mg',
  protocols: { adult: { doseRange: { min: 1, max: 2 }, description: 'x' } },
});

/* ---- the real registry ---- */
test('the shipped registry has no problems', () => {
  assert.deepEqual(validateRegistry(MEDICATIONS, SECTIONS), []);
});

/* ---- lookup ---- */
test('protocolFor returns the profile protocol or null', () => {
  assert.equal(protocolFor(MEDICATIONS.Atropine, 'adult'), null);
  assert.ok(protocolFor(MEDICATIONS.Atropine, 'pediatric').doseRange);
});

test('entriesFor lists only medications with a protocol for the profile, in registry order', () => {
  const ids = entriesFor(MEDICATIONS, 'adult').map(e => e.id);
  assert.ok(!ids.includes('Atropine'));
  assert.ok(ids.indexOf('Epinephrine') < ids.indexOf('Ketamine_RSI'));
});

test('entry carries label (falls back to key), active unit and sections', () => {
  const peds = entriesFor(MEDICATIONS, 'pediatric');
  const mid = peds.find(e => e.id === 'Midazolam_inf');
  assert.equal(mid.unit, 'mcg');                       // protocol unit overrides medication unit
  assert.equal(mid.label, 'Midazolam Infusion');
  assert.equal(peds.find(e => e.id === 'Atropine').label, 'Atropine');
  assert.deepEqual(peds.find(e => e.id === 'Atropine').sections, ['supportive-body']);
});

/* ---- validation ---- */
test('a missing required field is reported', () => {
  const m = good(); delete m.concentration;
  const problems = validateRegistry({ Bad: m }, SECTIONS);
  assert.equal(problems.length, 1); assert.match(problems[0], /Bad.*missing.*concentration/);
});

test('a protocol with neither doseRange nor infusionRate is reported', () => {
  const m = good(); m.protocols.adult = { description: 'x' };
  assert.match(validateRegistry({ Bad: m }, SECTIONS).join('\n'), /neither doseRange nor infusionRate/);
});

test('a missing description and an unrecognised key are reported', () => {
  const m = good(); delete m.protocols.adult.description; m.protocols.adult.dosRange = {};
  const text = validateRegistry({ Bad: m }, SECTIONS).join('\n');
  assert.match(text, /missing description/); assert.match(text, /unrecognized key: "dosRange"/);
});

test('an unknown section id is reported', () => {
  const m = good(); m.section = ['pain-bodyy'];
  assert.match(validateRegistry({ Bad: m }, SECTIONS).join('\n'), /unknown section "pain-bodyy"/);
});

test('a unit pair the dose math cannot convert is reported', () => {
  const m = good(); m.protocols.adult.unit = 'g';
  assert.match(validateRegistry({ Bad: m }, SECTIONS).join('\n'), /cannot convert unit "g" to "mg"/);
});

test('mcg on a mg medication is accepted', () => {
  const m = good(); m.protocols.adult.unit = 'mcg';
  assert.deepEqual(validateRegistry({ Ok: m }, SECTIONS), []);
});

test('min above max and a non-positive concentration are reported', () => {
  const m = good(); m.protocols.adult.doseRange = { min: 5, max: 2 }; m.concentration = 0;
  const text = validateRegistry({ Bad: m }, SECTIONS).join('\n');
  assert.match(text, /min \(5\) is above max \(2\)/); assert.match(text, /concentration must be a positive number/);
});
