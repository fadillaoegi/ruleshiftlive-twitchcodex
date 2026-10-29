// Cross-runtime proof for synthetic EventSub → Go use case → real game engine.
// No browser, real Twitch event, AI call or PostgreSQL server is implied.
import assert from 'node:assert/strict';
import { Engine, FLOOR, PLAYER_SIZE } from '../src/game/engine.ts';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const packet = JSON.parse(input);
assert.equal(packet.evidence_kind, 'PROTOCOL_FIXTURE');
assert.equal(packet.round.rule.trigger.every, 3);
assert.equal(packet.round.rule.effect.duration_ms, 4000);
const round = packet.round;
const start = Date.parse(round.started_at);
const game = new Engine(round);
const idle = { left: false, right: false, jump: false };
const trace = [];
let now = start;
let lastCoins = 0;
while (game.coins < 3 && now < start + 5000) {
  now += 16; game.tick(now, { ...idle, right: true });
  if (game.coins !== lastCoins) { trace.push({ elapsed_ms: now - start, coins: game.coins, gravity: game.gravity }); lastCoins = game.coins; }
}
assert.equal(game.coins, 3);
assert.deepEqual(trace.map(event => event.gravity), [1, 1, -1]);
const triggerAt = now;
const deadline = game.effectUntil;
assert.equal(deadline - triggerAt, 4000);
game.tick(now + 32, idle);
assert.ok(game.player.vy < 0);
assert.ok(game.player.y < FLOOR - PLAYER_SIZE);
game.tick(deadline - 1, idle); assert.equal(game.gravity, -1);
game.tick(deadline, idle); assert.equal(game.gravity, 1);
assert.equal(game.effectUntil, 0);
game.tick(Date.parse(round.ends_at), idle);
assert.equal(game.status, 'finished'); assert.equal(game.gravity, 1);

const stopped = new Engine(round);
for (let i = 0; i < 3; i++) stopped.collect(start + 100);
stopped.stop(); assert.equal(stopped.gravity, 1); assert.equal(stopped.effectUntil, 0);
console.log(JSON.stringify({
  evidence_kind: 'PROTOCOL_FIXTURE', status: 'passed', recorded_at: new Date().toISOString(),
  source: 'Synthetic EventSub adapter → Go approval/round → actual TypeScript Engine; no real Twitch or database',
  author: round.author, rule: round.rule, trace,
  trigger_elapsed_ms: triggerAt - start, effect_duration_ms: deadline - triggerAt,
  upward_motion: true, exact_expiry_restores_gravity: true,
  stop_clears_effect: true, automatic_round_end: true,
  final_coins: game.coins,
}));
