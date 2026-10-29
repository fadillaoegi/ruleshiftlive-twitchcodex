import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResultSync } from './result-sync.ts';
import { parseRehearsal } from './types.ts';
import type { Round } from './types.ts';

const start = Date.UTC(2026, 9, 29, 12);
function round(): Round { return { id: 'r', proposal_id: 'p', source: 'twitch', author: 'Fixture', rule: parseRehearsal('!rule Every third coin flips gravity for 4 seconds'), status: 'running', started_at: new Date(start).toISOString(), ends_at: new Date(start + 75000).toISOString(), sequence: 0, coins: 0 }; }
function saved(): Round { return { ...round(), status: 'finished', result_saved: true, sequence: 2, coins: 3 }; }

test('final report retries the identical sequence and score after a lost response', async () => {
  const calls: object[] = [];
  const sync = new ResultSync(async (path, body) => { calls.push({ path, ...body }); if (calls.length === 1) throw new Error('lost response'); return saved(); });
  sync.queue(round(), 'finish', 2, 3); await sync.flush(start + 75000);
  assert.equal(sync.state, 'pending');
  sync.queue(round(), 'finish', 99, 99); // Render/timer repeats cannot change a queued payload.
  await sync.flush(start + 77000); assert.equal(sync.state, 'saved'); assert.deepEqual(calls[0], calls[1]);
});
test('concurrent flushes share one in-flight write', async () => {
  let resolve: (value: Round) => void = () => {}; let calls = 0;
  const sync = new ResultSync(async () => { calls++; return new Promise<Round>(done => { resolve = done; }); });
  sync.queue(round(), 'stop', 2, 3); const first = sync.flush(start + 1000); const second = sync.flush(start + 1000);
  assert.equal(calls, 1); resolve({ ...saved(), status: 'stopped' }); await Promise.all([first, second]); assert.equal(sync.state, 'saved');
});
test('another round or altered score cannot be mistaken for confirmation', async () => {
  const sync = new ResultSync(async () => ({ ...saved(), id: 'other' }));
  sync.queue(round(), 'finish', 2, 3); await sync.flush(start + 75000); assert.equal(sync.state, 'pending');
  assert.equal(sync.observe({ ...saved(), coins: 4 }), false); assert.equal(sync.observe({ ...saved(), result_saved: false }), false);
});
test('polling can confirm a successful write whose response was lost', async () => {
  const sync = new ResultSync(async () => { throw new Error('lost response'); });
  sync.queue(round(), 'finish', 2, 3); await sync.flush(start + 75000);
  assert.equal(sync.observe(saved()), true); assert.equal(sync.pending, false);
  await sync.flush(start + 78000); assert.equal(sync.state, 'saved');
});
test('expired recovery is explicit and still accepts later read-only confirmation', async () => {
  let calls = 0; const sync = new ResultSync(async () => { calls++; return saved(); });
  sync.queue(round(), 'finish', 2, 3); await sync.flush(start + 105001);
  assert.equal(sync.state, 'failed'); assert.equal(calls, 0); assert.equal(sync.observe(saved()), true);
});
test('rehearsal results never enter the live delivery path', () => {
  const sync = new ResultSync(async () => saved());
  assert.throws(() => sync.queue({ ...round(), source: 'rehearsal' }, 'finish', 2, 3), /Rehearsals/);
  assert.equal(sync.state, 'idle');
});
test('an already-closed server result is preserved when another controller stopped it', async () => {
  let calls = 0; const sync = new ResultSync(async () => { calls++; return saved(); });
  assert.equal(sync.observe({ ...saved(), status: 'stopped' }), true);
  sync.queue(round(), 'stop', 99, 4); await sync.flush(start + 1000);
  assert.equal(calls, 0); assert.equal(sync.confirmed?.coins, 3); assert.equal(sync.state, 'saved');
});
