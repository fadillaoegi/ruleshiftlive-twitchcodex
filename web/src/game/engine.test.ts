import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CEILING, Engine, FLOOR, PLATFORMS, PLAYER_SIZE } from './engine.ts';
import { parseRehearsal } from './types.ts';
import type { Round } from './types.ts';

const start = Date.UTC(2026, 9, 29, 12);
const idle = { left: false, right: false, jump: false };
function fixture(): Round {
  return { id: 'fixture-round', proposal_id: 'fixture-proposal', author: 'Fixture viewer', source: 'rehearsal', rule: parseRehearsal('!rule Every third coin flips gravity for 4 seconds'), status: 'running', started_at: new Date(start).toISOString(), ends_at: new Date(start + 75000).toISOString(), coins: 0, sequence: 0 };
}
function three(engine: Engine, now = start + 100) { engine.collect(now); engine.collect(now); return engine.collect(now); }

test('Go parser and browser rehearsal share the rule contract cases', () => {
  const cases = JSON.parse(readFileSync(new URL('../../../docs/rule-contract-cases.json', import.meta.url), 'utf8')) as { text: string; valid: boolean; every?: number; duration_ms?: number }[];
  for (const c of cases) {
    if (!c.valid) assert.throws(() => parseRehearsal(c.text), c.text);
    else { const rule = parseRehearsal(c.text); assert.equal(rule.trigger.every, c.every); assert.equal(rule.effect.duration_ms, c.duration_ms); }
  }
});
test('the third coin condition changes gravity, not earlier coins', () => {
  const engine = new Engine(fixture());
  assert.equal(engine.collect(start + 100), false); assert.equal(engine.gravity, 1);
  assert.equal(engine.collect(start + 200), false); assert.equal(engine.gravity, 1);
  assert.equal(engine.collect(start + 300), true); assert.equal(engine.gravity, -1);
  assert.equal(engine.effectUntil, start + 4300);
});
test('gravity actually accelerates the player upward', () => {
  const engine = new Engine(fixture()); three(engine);
  for (let i = 1; i <= 30; i++) engine.tick(start + i * 16, idle);
  assert.ok(engine.player.y < FLOOR - PLAYER_SIZE - 50); assert.ok(engine.player.vy < 0);
});
test('real player movement and collision collect the third coin and trigger the rule', () => {
  const engine = new Engine(fixture());
  for (let i = 1; i <= 150 && engine.coins < 3; i++) engine.tick(start + i * 16, { ...idle, right: true });
  assert.equal(engine.coins, 3); assert.equal(engine.gravity, -1); assert.equal(engine.triggers, 1);
});
test('platform undersides are solid under reversed gravity', () => {
  const engine = new Engine(fixture());
  engine.player.x = PLATFORMS[1].x + 20;
  three(engine);
  for (let i = 1; i <= 120; i++) engine.tick(start + i * 16, idle);
  assert.equal(engine.player.y, PLATFORMS[1].y + PLATFORMS[1].h);
  assert.equal(engine.player.grounded, true); assert.equal(engine.player.vy, 0);
});
test('expiry restores normal gravity at the exact absolute deadline', () => {
  const engine = new Engine(fixture()); three(engine);
  engine.tick(start + 4099, idle); assert.equal(engine.gravity, -1);
  engine.tick(start + 4100, idle); assert.equal(engine.gravity, 1); assert.equal(engine.effectUntil, 0);
});
test('overlapping triggers refresh the deadline without toggling or stacking', () => {
  const engine = new Engine(fixture()); three(engine);
  three(engine, start + 2000); assert.equal(engine.gravity, -1); assert.equal(engine.effectUntil, start + 6000);
  engine.tick(start + 4100, idle); assert.equal(engine.gravity, -1);
  engine.tick(start + 6000, idle); assert.equal(engine.gravity, 1); assert.equal(engine.triggers, 2);
});
test('background-tab suspension cannot leave a permanent gravity flip', () => {
  const engine = new Engine(fixture()); three(engine);
  engine.tick(start + 20000, idle); assert.equal(engine.gravity, 1); assert.equal(engine.effectUntil, 0);
});
test('round expiry caps effects and prevents further scoring and movement', () => {
  const engine = new Engine(fixture()); three(engine, start + 74000);
  assert.equal(engine.effectUntil, start + 75000);
  const view = engine.tick(start + 75000, { ...idle, right: true });
  assert.equal(view.status, 'finished'); assert.equal(view.gravity, 1); assert.equal(view.effectRemaining, 0);
  const position = { ...engine.player }; assert.equal(engine.collect(start + 75001), false);
  engine.tick(start + 76000, { ...idle, right: true }); assert.deepEqual(engine.player, position); assert.equal(engine.coins, 3);
});
test('streamer stop clears effects immediately and blocks further triggers', () => {
  const engine = new Engine(fixture()); three(engine); engine.stop();
  assert.equal(engine.gravity, 1); assert.equal(engine.effectUntil, 0); assert.equal(engine.status, 'stopped');
  engine.collect(start + 200); assert.equal(engine.coins, 3);
});
test('round definition is frozen by copying and invalid schemas never start', () => {
  const round = fixture(); const engine = new Engine(round);
  round.rule.trigger.every = 7; three(engine); assert.equal(engine.gravity, -1);
  round.rule.effect.duration_ms = 7000; assert.throws(() => new Engine(round));
});
test('jump requires a supporting surface, and a held key does not auto-jump', () => {
  const engine = new Engine(fixture());
  engine.tick(start + 16, { ...idle, jump: true }); const velocity = engine.player.vy;
  assert.ok(velocity < 0); engine.tick(start + 32, { ...idle, jump: true }); assert.ok(engine.player.vy > velocity);
  for (let i = 3; i <= 120; i++) engine.tick(start + i * 16, { ...idle, jump: true });
  assert.equal(engine.player.y, FLOOR - PLAYER_SIZE); assert.equal(engine.player.grounded, true);
});
test('expiry never strands ceiling coins for any supported trigger frequency', () => {
  for (let every = 2; every <= 10; every++) {
    const round = fixture(); round.rule.trigger.every = every;
    const engine = new Engine(round);
    for (let i = 0; i < every; i++) engine.collect(start + 100);
    assert.equal(engine.coin.y, CEILING + 16);
    engine.tick(start + 4100, idle);
    assert.equal(engine.coin.y, FLOOR - 16);
  }
});
