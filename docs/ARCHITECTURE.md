# Architecture

```text
web/ React controller ── HTTP commands/state ──> HTTP adapter
        │                                         │
        └─ Canvas renderer → game engine            ▼
                                          application.Service
Twitch OAuth/EventSub adapter ─────────────────>    │
                                                   ▼
                                         domain entities + ports
                                                   ▲
                          parser adapter / PostgreSQL repository
```

`backend/internal/domain` owns RuleProposal, RuleDefinition and Round, bounds and
approval requirements. It imports only the standard library. Application use
cases depend on Repository and Interpreter interfaces, without SDK dependencies.
Adapters handle HTTP, the constrained grammar, Twitch and PostgreSQL. `cmd/server`
is the composition root. `testsupport` is imported only by automated tests.

The local application supports one backend process. A service mutex serializes
queue admission, cooldown, decisions, starts, stops and telemetry. PostgreSQL
unique constraints independently enforce chat-message deduplication, one approved
proposal and one running round. Atomic transactions consume approval and create
the round together. Queue admission is capped at 32 pending proposals, with a
10-second per-viewer cooldown persisted across process restarts. Snapshots always
retain actionable proposals plus a bounded historical tail.

The backend authorizes a rule and assigns absolute start/end deadlines. Canvas
executes the local physics from that exact validated definition. HTTP polling
aligns the client clock to server time; server ticks expire round status even
without a connected browser. Client effect and round deadlines expire after a
background-tab pause. Repeated coin conditions refresh one effect deadline;
normal gravity is always restored on expiry/stop. Both floor and platform
undersides participate in collision. A held jump key cannot repeatedly jump.
The next coin follows the current gravity surface, so another supported coin
frequency or expired effect cannot strand an unreachable coin at the ceiling.

One controller tab owns the running simulation. Scores are informational local
telemetry with increasing sequence numbers, not trusted gameplay attestation.
Reopening a tab cannot replay player inputs. The current live round can be stopped
from another local dashboard, but it cannot be resumed from a fabricated state.

Rehearsal uses the same TypeScript engine and rule shape, with separate browser
proposals explicitly marked `rehearsal`. It never calls a live intake endpoint or
persists fake Twitch data. The backend has no public event injection route and
no in-memory runtime persistence fallback. A repository double is confined to
automated tests. Shared grammar fixtures guard Go/browser interpretation parity.

All server listeners are loopback-only. Browser mutations require a local
HttpOnly/SameSite session and CSRF header, with exact-origin checks. OAuth's
cross-site callback is permitted only through one-use, cookie-bound state with
10-minute expiry. Authorization-code exchange, refresh and hourly validation
stay in Go memory. Responses omit token bodies and upstream error details.
Reconnect URLs are restricted to Twitch's exact EventSub WSS host. Input bodies
are bounded, unknown command fields rejected and chat never executed as code.

Pixel visuals are code-native: a 5×7 SVG title, hand-authored robot/coin sprites,
a half-resolution Canvas backing store with nearest-neighbour scaling, neon
surface markers and static scanlines. No remote font or image service is needed.
