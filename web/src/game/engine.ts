import { validateRule } from './types.ts';
import type { Round } from './types.ts';

export const WIDTH = 960;
export const HEIGHT = 500;
export const FLOOR = 460;
export const CEILING = 40;
export const PLAYER_SIZE = 28;
export const PLATFORMS = [
  { x: 210, y: 340, w: 140, h: 14 },
  { x: 440, y: 248, w: 110, h: 14 },
  { x: 650, y: 150, w: 140, h: 14 },
];
export interface Input { left: boolean; right: boolean; jump: boolean }
export interface GameEvent { kind: 'coin_collected' | 'gravity_flip' | 'effect_expired' | 'round_stopped' | 'round_finished'; at: string; coins: number; gravity: 1 | -1; effect_ends_at?: string }
export interface GameView {
  coins: number;
  gravity: 1 | -1;
  effectRemaining: number;
  secondsRemaining: number;
  status: 'running' | 'stopped' | 'finished';
  triggers: number;
  nextTrigger: number;
}

// The Canvas renderer and rehearsal use this same engine. Absolute deadlines
// expire even if requestAnimationFrame pauses in a background tab.
export class Engine {
  readonly round: Round;
  player = { x: 64, y: FLOOR - PLAYER_SIZE, vx: 0, vy: 0, grounded: true };
  coins = 0;
  triggers = 0;
  gravity: 1 | -1 = 1;
  effectUntil = 0;
  status: GameView['status'] = 'running';
  lastEvent = 'Collect coins. Let chat change the rules.';
  events: GameEvent[] = [];
  eventsDropped = 0;
  private lastTime: number;
  private jumpWasDown = false;

  constructor(round: Round) {
    validateRule(round.rule);
    this.round = structuredClone(round);
    this.lastTime = Date.parse(round.started_at);
  }
  get coin(): { x: number; y: number } {
    // The next coin follows the current gravity surface. An expired effect
    // must never strand an unreachable ceiling coin at another frequency.
    return { x: 170 + (this.coins % 6) * 120, y: this.gravity === 1 ? FLOOR - 16 : CEILING + 16 };
  }
  private gravityTo(value: 1 | -1): void {
    if (this.gravity !== value) { this.gravity = value; this.player.grounded = false; }
  }
  private record(kind: GameEvent['kind'], now: number): void {
    this.events.push({ kind, at: new Date(now).toISOString(), coins: this.coins, gravity: this.gravity, ...(this.effectUntil ? { effect_ends_at: new Date(this.effectUntil).toISOString() } : {}) });
    if (this.events.length > 64) { this.events.shift(); this.eventsDropped++; }
  }
  private deadlines(now: number): void {
    if (this.status !== 'running') return;
    if (now >= Date.parse(this.round.ends_at)) {
      this.status = 'finished'; this.effectUntil = 0; this.gravityTo(1); this.player.vx = 0; this.player.vy = 0;
      this.lastEvent = this.coins >= 12 ? 'Round complete. You beat chat’s challenge!' : 'Round complete. Give chat another chance.';
      this.record('round_finished', now);
    } else if (this.effectUntil > 0 && now >= this.effectUntil) {
      this.effectUntil = 0; this.gravityTo(1); this.lastEvent = 'Effect expired. Gravity restored.';
      this.record('effect_expired', now);
    }
  }
  collect(now: number): boolean {
    this.deadlines(now);
    if (this.status !== 'running') return false;
    this.coins++;
    this.record('coin_collected', now);
    if (this.coins % this.round.rule.trigger.every === 0) {
      // Refresh, never toggle or stack. Expiry always restores +1 gravity.
      this.triggers++;
      this.gravityTo(-1);
      this.effectUntil = Math.min(now + this.round.rule.effect.duration_ms, Date.parse(this.round.ends_at));
      this.lastEvent = `Coin ${this.coins} → gravity reversed! Rule by ${this.round.author}.`;
      this.record('gravity_flip', now);
      return true;
    }
    this.lastEvent = `Coin ${this.coins} collected. ${this.round.rule.trigger.every - this.coins % this.round.rule.trigger.every} until gravity flips.`;
    return false;
  }
  stop(): void {
    if (this.status !== 'running') return;
    this.status = 'stopped'; this.effectUntil = 0; this.gravityTo(1); this.player.vx = 0; this.player.vy = 0;
    this.lastEvent = 'Streamer stopped the round. All effects cleared.';
    this.record('round_stopped', Math.max(this.lastTime, Date.parse(this.events.at(-1)?.at ?? this.round.started_at)));
  }
  tick(now: number, input: Input): GameView {
    this.deadlines(now);
    const dt = Math.max(0, Math.min((now - this.lastTime) / 1000, 0.1));
    this.lastTime = now;
    if (this.status !== 'running') return this.view(now);
    const jump = input.jump && !this.jumpWasDown;
    this.jumpWasDown = input.jump;
    if (jump && this.player.grounded) { this.player.vy = -this.gravity * 460; this.player.grounded = false; }
    this.player.vx = (Number(input.right) - Number(input.left)) * 300;
    const steps = Math.max(1, Math.ceil(dt * 120));
    for (let i = 0; i < steps; i++) this.physics(dt / steps, now);
    return this.view(now);
  }
  private physics(dt: number, now: number): void {
    const p = this.player;
    p.x = Math.max(22, Math.min(WIDTH - PLAYER_SIZE - 22, p.x + p.vx * dt));
    const oldY = p.y;
    p.vy = Math.max(-720, Math.min(720, p.vy + this.gravity * 1100 * dt));
    p.y += p.vy * dt;
    p.grounded = false;
    if (p.y + PLAYER_SIZE >= FLOOR) { p.y = FLOOR - PLAYER_SIZE; p.vy = 0; p.grounded = this.gravity === 1; }
    if (p.y <= CEILING) { p.y = CEILING; p.vy = 0; p.grounded = this.gravity === -1; }
    for (const platform of PLATFORMS) {
      if (p.x + PLAYER_SIZE <= platform.x || p.x >= platform.x + platform.w) continue;
      if (p.vy >= 0 && oldY + PLAYER_SIZE <= platform.y && p.y + PLAYER_SIZE >= platform.y) {
        p.y = platform.y - PLAYER_SIZE; p.vy = 0; p.grounded = this.gravity === 1;
      } else if (p.vy <= 0 && oldY >= platform.y + platform.h && p.y <= platform.y + platform.h) {
        p.y = platform.y + platform.h; p.vy = 0; p.grounded = this.gravity === -1;
      }
    }
    const c = this.coin;
    if (Math.abs(p.x + PLAYER_SIZE / 2 - c.x) < 24 && Math.abs(p.y + PLAYER_SIZE / 2 - c.y) < 26) this.collect(now);
  }
  view(now: number): GameView {
    return { coins: this.coins, gravity: this.gravity, effectRemaining: Math.max(0, (this.effectUntil - now) / 1000), secondsRemaining: Math.max(0, (Date.parse(this.round.ends_at) - now) / 1000), status: this.status, triggers: this.triggers, nextTrigger: this.round.rule.trigger.every - this.coins % this.round.rule.trigger.every };
  }
}
