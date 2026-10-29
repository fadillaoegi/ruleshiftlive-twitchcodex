import type { Engine } from './engine.ts';
import type { Round } from './types.ts';

export function controllerRecord(engine: Engine, confirmed: Round | null, exportedAt = new Date().toISOString()) {
  const saved = engine.round.source === 'twitch' && confirmed?.id === engine.round.id && confirmed.source === 'twitch' && confirmed.result_saved && ['finished', 'stopped'].includes(confirmed.status) ? confirmed : null;
  return {
    version: 1,
    evidence_kind: engine.round.source === 'rehearsal' ? 'LOCAL_REHEARSAL' : 'TWITCH_CONTROLLER_RECORD',
    live_verification: engine.round.source === 'rehearsal' ? 'not_live' : 'pending_manual_review',
    exported_at: exportedAt,
    interpreter: 'constrained_parser',
    storage: engine.round.source === 'rehearsal' ? 'browser_only' : saved ? 'postgresql_confirmed' : 'unconfirmed',
    round: structuredClone(saved ?? { ...engine.round, status: engine.status, coins: engine.coins, result_saved: false }),
    observed_game: { coins: engine.coins, triggers: engine.triggers, status: engine.status, gravity: engine.gravity },
    controller_events: structuredClone(engine.events),
    events_dropped: engine.eventsDropped,
    note: 'Controller capture only. Local scores are untrusted. A real Twitch milestone still requires manual live, database and OBS verification.',
  };
}
