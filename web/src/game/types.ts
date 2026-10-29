export interface RuleDefinition {
  version: 1;
  trigger: { kind: 'coin_collected'; every: number };
  effect: { kind: 'gravity_flip'; duration_ms: number };
}
export interface Proposal {
  id: string;
  message_id: string;
  author: string;
  text: string;
  source: 'twitch' | 'rehearsal';
  status: 'pending' | 'approved' | 'unsupported' | 'vetoed' | 'used';
  rule: RuleDefinition | null;
  reason?: string;
  created_at: string;
}
export interface Round {
  id: string;
  proposal_id: string;
  author: string;
  source: 'twitch' | 'rehearsal';
  rule: RuleDefinition;
  status: 'running' | 'stopped' | 'finished';
  started_at: string;
  ends_at: string;
  coins: number;
  sequence: number;
}
export interface ServerState {
  database: 'connected' | 'unavailable';
  twitch: { state: string; detail: string; channel?: string; last_message_at?: string };
  proposals: Proposal[];
  round: Round | null;
  server_time: string;
}
export function validateRule(rule: RuleDefinition): void {
  if (rule.version !== 1 || rule.trigger.kind !== 'coin_collected' || rule.effect.kind !== 'gravity_flip'
    || !Number.isInteger(rule.trigger.every) || rule.trigger.every < 2 || rule.trigger.every > 10
    || !Number.isInteger(rule.effect.duration_ms) || rule.effect.duration_ms < 1000 || rule.effect.duration_ms > 6000
    || rule.effect.duration_ms % 1000 !== 0) {
    throw new Error('Unsupported rule definition.');
  }
}
export function parseRehearsal(text: string): RuleDefinition {
  if (text.length > 500) throw new Error('Messages must be 500 characters or fewer.');
  const match = /^!rule every (third|[0-9]+)(?: coins?| coin) flips gravity for ([0-9]+) seconds?\.?$/i.exec(text.trim());
  if (!match) throw new Error('Try: !rule Every third coin flips gravity for 4 seconds');
  const rule: RuleDefinition = { version: 1, trigger: { kind: 'coin_collected', every: match[1].toLowerCase() === 'third' ? 3 : Number(match[1]) }, effect: { kind: 'gravity_flip', duration_ms: Number(match[2]) * 1000 } };
  validateRule(rule);
  return rule;
}
export function summary(rule: RuleDefinition): string {
  return `Every ${rule.trigger.every} coins, gravity reverses for ${rule.effect.duration_ms / 1000} seconds.`;
}
