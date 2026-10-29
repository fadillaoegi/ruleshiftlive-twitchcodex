import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Engine } from './engine.ts';
import { controllerRecord } from './record.ts';
import { parseRehearsal } from './types.ts';
import type { Round } from './types.ts';
const start = Date.UTC(2026, 9, 29, 12);
function round(): Round { return { id: 'r', proposal_id: 'p', message_id: 'fixture-message', source: 'rehearsal', author: 'Fixture', rule: parseRehearsal('!rule Every third coin flips gravity for 4 seconds'), status: 'running', started_at: new Date(start).toISOString(), ends_at: new Date(start + 75000).toISOString(), sequence: 0, coins: 0 }; }

test('rehearsal export can never claim Twitch or PostgreSQL confirmation', () => {
  const engine = new Engine(round()); engine.collect(start + 100); engine.stop();
  const record = controllerRecord(engine, { ...round(), result_saved: true, status: 'stopped' });
  assert.equal(record.evidence_kind, 'LOCAL_REHEARSAL'); assert.equal(record.live_verification, 'not_live'); assert.equal(record.storage, 'browser_only'); assert.equal(record.round.coins, 1);
});
test('a real-source controller capture still requires manual live verification', () => {
  const engine = new Engine({ ...round(), source: 'twitch' }); engine.stop();
  const record = controllerRecord(engine, { ...engine.round, result_saved: true, status: 'stopped', sequence: 1, coins: 3 });
  assert.equal(record.storage, 'postgresql_confirmed'); assert.equal(record.round.coins, 3); assert.equal(record.round.message_id, 'fixture-message'); assert.equal(record.live_verification, 'pending_manual_review');
  assert.equal(controllerRecord(engine, { ...engine.round, id: 'other', result_saved: true }).storage, 'unconfirmed');
});
test('event capture records trigger and restoration and remains a detached bounded snapshot', () => {
  const engine = new Engine(round()); for (let i = 0; i < 3; i++) engine.collect(start + 100);
  engine.tick(start + 4100, { left: false, right: false, jump: false });
  const record = controllerRecord(engine, null); const flip = record.controller_events.find(e => e.kind === 'gravity_flip');
  assert.equal(flip?.coins, 3); assert.equal(flip?.gravity, -1); assert.equal(flip?.effect_ends_at, new Date(start + 4100).toISOString());
  assert.equal(record.controller_events.at(-1)?.kind, 'effect_expired'); assert.equal(record.controller_events.at(-1)?.gravity, 1);
  for (let i = 0; i < 100; i++) engine.collect(start + 5000);
  assert.equal(engine.events.length, 64); assert.ok(record.controller_events.length < 64); assert.ok(engine.eventsDropped > 0); assert.equal(record.events_dropped, 0);
});
