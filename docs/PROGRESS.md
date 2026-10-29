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
| Real PostgreSQL migration/integration | Pending — accessible PostgreSQL instance |
| Local rule/game behavior | Passed — 13 engine/contract tests |
| EventSub protocol fixtures | Passed — synthetic, not live evidence |
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

## Actual verification

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
