# Progress

## 2026-10-29 — Implementation session

Read the original handoff and linked competition strategy from
`/Users/boo/Github/project/Hacketon/research/`. The supplied workspace was empty.
Implementation lives in `ruleshift-live/` within the authorized workspace; the
handoff's proposed sibling directory is outside this session's writable roots.

Environment: macOS arm64, Go 1.26.3, Node 24.15.0, pnpm 11.1.3. No Twitch,
database or AI credentials found in environment. No PostgreSQL executable found.
Docker is installed but socket access is denied by the session sandbox. Port
5173 is occupied; 5174 is selected for this project. Backend 8080 is available.
OBS is installed, but capture/readability has not been tested.

Outbound DNS from the terminal is unavailable. Existing npm and Go dependency
caches will be used. No paid services or unrelated project credentials are used.

## Evidence status

| Evidence | Status |
| --- | --- |
| Real Twitch OAuth and chat | Pending — app credentials and interactive consent |
| Real PostgreSQL 18 migration/integration | Pending — existing Docker instance reported by user; socket access denied |
| Local rule/game behavior | Passed — 13 engine/contract tests |
| Frontend transport failure handling | Passed — 6 tests |
| EventSub protocol fixtures | Passed — synthetic, not live evidence |
| Backend → actual game engine | Passed — cross-runtime protocol fixture, not live |
| Final-score retry and round records | Passed locally — real database/browser verification pending |
| AI inference | Not implemented; provider access/budget unverified |
| Browser, OBS and 720p live playtest | Pending — sandbox denies localhost listeners |

The first live milestone is **not complete** until a real chat message is
approved and affects a playable round, with recorded expiry evidence.

## Implemented this session

- Scaffolded `web/`, `backend/`, `docs/` and `submission/` with local Git history.
- Added domain entities, use-case ports, PostgreSQL migration and transactional
  repository. No alternate runtime persistence is used when PostgreSQL is absent.
- Added Twitch OAuth state verification, backend token exchange, validation and
  refresh, own-channel EventSub subscription, keepalive deadlines, reconnect
  handoff, retry, revocation and visible missing-message gaps.
- Added a supported-rule queue with 32 pending slots, persisted deduplication and
  cooldown, approval/veto, one approved rule, one 75-second round, sequenced
  informational telemetry and automatic server expiry.
- Built the React controller, separate browser rehearsal and Canvas simulation.
  The third coin changes actual acceleration; floor, ceiling and platforms are
  solid. Retriggers refresh one timer, expiry restores normal gravity, and stop
  clears effects immediately. Coins follow gravity so expiry cannot strand them.
- Applied the user's **pixel retro cyberpunk** direction: original 5×7 bitmap
  lettering, pixel robot/coin, city silhouette, cyan/magenta surfaces, hard panel
  edges and static scanlines. No remote fonts or downloaded art are needed.
- Added shared Go/TypeScript grammar cases, lifecycle/race/HTTP/EventSub fixtures,
  an opt-in real PostgreSQL test and a future browser-check script.
- Saved reproducible verification and a real Twitch runbook. AI interpretation,
  game preview, temporary platforms and OBS overlay remain after the live gate.

## Initial session verification

`scripts/verify.mjs` passed all four commands: Go tests with race detection,
`go vet`, web tests and production build. Go reported 28 passing tests including
subtests (15 top-level tests); one PostgreSQL integration test was explicitly
skipped. All 13 web tests passed. See `docs/evidence/local-checks.json` and
`docs/VERIFICATION.md` for provenance and limits. Full local logs are ignored
under `.local/checks/`.

The first offline npm attempt failed because the shared cache was read-only.
Cloning that existing cache into `/private/tmp/ruleshift-npm-cache` allowed offline
installation without modifying other projects or downloading packages. Both
frontend and backend compile with the cached dependencies.

Attempts to launch Vite on 127.0.0.1:5174 and Go on 127.0.0.1:8080 failed with
`EPERM` / `bind: operation not permitted`. No preview server remains running.
No browser screenshot, OBS recording, real database migration, real Twitch event
or AI-provider inference has been claimed from this session.

## Next action

On a local session that permits loopback listeners and Twitch egress, start
PostgreSQL and both applications using the README. Supply Twitch app credentials
privately, connect the broadcaster account, then execute
`docs/LIVE-VERIFICATION.md`. Complete that real flow before expanding mechanics.

## Continuation — existing PostgreSQL 18 and startup readiness

The user clarified that PostgreSQL 18 already runs in their Docker installation.
The project now targets that existing instance. No container or volume was
created, restarted or changed. Docker metadata shows the active `desktop-linux`
context, but `docker ps` is denied by sandbox socket permissions. TCP connection
and listener probes on 8080/5174/5432 also return `EPERM`. No backend `.env` exists,
and no database or Twitch credentials are set in this process.

Completed independent work:

- Added a read-only database inspector and actual-server version check before
  migrations; both application and opt-in integration test target major 18.
- Added `scripts/doctor.mjs`, which reports credential presence without values,
  Docker metadata when permitted, listener availability and Twitch DNS. Actual
  results are saved in `docs/evidence/environment.json` with unresolved access.
- Added a single-command local launcher that parses `backend/.env` as data,
  builds Go, starts Go/Vite and stops its own children on exit. It never manages
  Docker or passes backend credentials to the frontend process. The configuration
  guard was exercised; real launch remains blocked/unverified.
- Documented reuse of the existing PostgreSQL 18 container and dedicated app/test
  databases in `docs/POSTGRES-18.md`. The optional fresh-machine Compose example
  now uses 18 with its correct volume layout and an explicit opt-in profile.
- Added a true cross-runtime fixture test: synthetic EventSub → Go intake →
  approval → Round JSON → actual TypeScript Engine. Movement collects the third
  coin at 1,040 ms, causing upward acceleration; gravity returns at the exact
  four-second effect deadline. Stop and automatic round expiry also pass. This
  trace is saved as `PROTOCOL_FIXTURE`, never real Twitch/DB evidence.
- Bounded frontend HTTP waits to five seconds, added readable proxy/network
  errors and cancellation, removed stale connected wording after backend loss,
  restored Twitch mode after OAuth return, and initialized successful rounds
  before optional status refresh so a refresh failure cannot prevent gameplay.

Verification for that continuation: **29 Go tests including subtests (16 top-level), 19
web tests, Go vet and production build passed**. Real PostgreSQL 18 integration
remains skipped. Browser/OBS, real Twitch consent/chat and AI are still pending.
No AI/temporary-platform/overlay expansion has started before the live gate.

Next external prerequisite: a session permitted to access the existing Docker
instance and loopback ports, plus private database/Twitch configuration in
`backend/.env`. Then run `node scripts/doctor.mjs`, `node scripts/verify.mjs` and
`node scripts/dev.mjs --live`, and execute the live runbook.

## Continuation — final result delivery and source-labeled records

Rechecked Docker access and local configuration: `docker ps` still returns
permission denied, and `backend/.env` is absent. The real Twitch/PostgreSQL 18
milestone remains pending. No container or volume was changed.

Fixed a first-milestone lifecycle gap: periodic telemetry could miss a coin
collected just before stop/expiry. A final report now atomically closes the
round with its last score and an immutable `result_saved` flag. Completion is
server-timed, accepts bounded recovery, tolerates identical retries after a lost
acknowledgement, and addresses the exact round ID. Delayed reports cannot modify
a newer round. Migration 002 also preserves the originating chat message ID.

The frontend queues a stable final payload, retries while the controller remains
open, reconciles confirmations from polling and shows saved/pending/failed state.
Starting another round is blocked while a result is unresolved. A hidden-tab
deadline check can close a round without running a second physics simulation.
The Stop action now targets the actual server round when the local tab lacks
its simulation, including a lost Start-response scenario.

Added a pixel-styled round result panel and JSON download with attribution,
message ID, outcome and a bounded controller-event tail/dropped count. Exports
are explicitly `LOCAL_REHEARSAL` or `TWITCH_CONTROLLER_RECORD`. A Twitch record
always requires manual live review; only a matching backend acknowledgement
marks storage confirmed. Rehearsal records never claim PostgreSQL or live use.

The synthetic cross-runtime test now carries its actual engine score back to
the backend and verifies retryable finalization in the test repository. Latest
checks: **35 Go tests including subtests (22 top-level), 29 web tests, Go vet
and production build passed**. Real PostgreSQL 18 integration is still skipped.
The browser script now checks rehearsal downloads but remains unexecuted because
no preview is available. No browser/OBS screenshot or real Twitch event is claimed.

Pending result delivery lives in controller memory; closing/reloading can lose
it. The server accepts recovery until 30 seconds after its deadline. Longer
offline periods leave a clearly unconfirmed local record. These limitations
are documented in the README and live runbook.
