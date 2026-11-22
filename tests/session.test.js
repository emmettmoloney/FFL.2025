import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, ALL_SECTIONS, SECTION_GROUPS } from '../scripts/session.js';

const make = () => {
  const events = [];
  const session = createSession({ onChange: (type, state) => events.push([type, state]) });
  return { session, events };
};

test('a new session is on the start page with no profile', () => {
  const { session } = make();
  assert.equal(session.page, 'start');
  assert.equal(session.profile, null);
  assert.deepEqual(session.visibleSections, []);
});

test('start(profile) opens the calculator with no sections shown yet', () => {
  const { session, events } = make();
  session.start('pediatric');
  assert.equal(session.page, 'calculator');
  assert.equal(session.profile, 'pediatric');
  assert.deepEqual(session.visibleSections, []);
  assert.equal(events.length, 1); assert.equal(events[0][0], 'start');
});

test('an unknown profile is rejected', () => {
  const { session, events } = make();
  assert.throws(() => session.start('neonate'), /unknown profile/);
  assert.equal(session.page, 'start'); assert.equal(events.length, 0);
});

test('showSections selects the sections of a section group', () => {
  const { session } = make();
  session.start('adult');
  session.showSections('RSI/DSI');
  assert.deepEqual(session.visibleSections, ['supportive-body', 'induction-body', 'paralytic-body']);
  session.showSections('Seizures');
  assert.deepEqual(session.visibleSections, ['seizures-first-body', 'seizures-second-body', 'seizures-third-body']);
});

test('Show me Everything selects every section', () => {
  const { session } = make();
  session.start('adult');
  session.showSections('Show me Everything');
  assert.deepEqual(session.visibleSections, ALL_SECTIONS);
});

test('an unknown section group shows nothing', () => {
  const { session } = make();
  session.start('adult');
  session.showSections('Nonsense');
  assert.deepEqual(session.visibleSections, []);
});

test('showSections before a profile is chosen is rejected', () => {
  const { session } = make();
  assert.throws(() => session.showSections('RSI/DSI'), /no profile/);
});

test('home() returns to the start page and keeps the selection', () => {
  const { session, events } = make();
  session.start('geriatric'); session.showSections('Pain & Sed.');
  session.home();
  assert.equal(session.page, 'start');
  assert.deepEqual(session.visibleSections, SECTION_GROUPS['Pain & Sed.']);
  assert.deepEqual(events.map(e => e[0]), ['start', 'sections', 'home']);
});

test('visibleSections returns a copy, so callers cannot change the session', () => {
  const { session } = make();
  session.start('adult'); session.showSections('Show me Everything');
  session.visibleSections.pop();
  assert.equal(session.visibleSections.length, ALL_SECTIONS.length);
});
