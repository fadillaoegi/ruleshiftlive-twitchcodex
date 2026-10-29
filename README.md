# RuleShift Live

**Chat writes the rules. You survive them.**

A pixel retro cyberpunk browser game for Twitch streamers. Viewers propose
conditional rules, the streamer approves one, and the rule changes actual
gravity and collisions during a 75-second round. Collect 12 coins and survive
until the timer ends. Audience attribution stays visible alongside the rule.

The product hypothesis is that viewers want their creativity to shape moments
on stream, while streamers need an activity that is easy to explain and control.
Engagement improvements have not been measured.

This is the first-milestone implementation for Codex × TwitchCon. **Real Twitch
verification is pending.** No Twitch credentials or accessible PostgreSQL server
were available in the implementation session; its sandbox also denied localhost
listeners, Docker socket access and terminal DNS. Unit, in-process HTTP and
EventSub fixture tests passed. Browser/OBS verification remains pending.

## Implemented scope

- React + TypeScript + Vite + Tailwind CSS, with a Canvas 2D game.
- Go with inward-pointing Clean Architecture boundaries and PostgreSQL 18 storage.
- Twitch authorization-code OAuth, backend-only tokens, validation/refresh and
  EventSub WebSocket chat intake for the signed-in broadcaster's own channel.
- A bounded proposal queue, message-ID deduplication, viewer cooldown, explicit
  approval/veto, one approved rule and one active round.
- Conditional gravity reversal with real acceleration, solid surfaces, expiry,
  overlap handling, immediate stop and proposer credit.
- Final-score delivery on stop/expiry, identical retries and immutable closed
  results; a clear distinction between saved, pending and rehearsal results.
- Downloadable source-labeled round records with message attribution and a
  bounded controller event trace for later live verification.
- Clearly labeled browser rehearsal, independent of credentials and persistence.
- Original pixel sprites, bitmap lettering and a neon cyberpunk arena. No remote
  fonts, stock art, external assets or heavy GPU dependencies.

Interpretation currently uses a **limited parser, not AI**:

```text
!rule Every third coin flips gravity for 4 seconds
!rule Every 2 coins flips gravity for 3 seconds
```

Supported frequencies are 2–10 coins; durations are whole seconds from 1–6.
Repeated triggers refresh the timer. They never toggle gravity back, accumulate
timers or leave gravity reversed after the effect or round ends. Unsupported
requests remain unexecutable. Chat text is never run as code.

## Run locally

Requirements: Node 24+, Go 1.26+, and the user's **existing PostgreSQL 18 Docker
container**. Run these commands **from `ruleshift-live/`** unless noted.
The default web URL is `http://localhost:5174`; backend is loopback-only on 8080.
Port 5173 belongs to another local application and is intentionally avoided.

Install the web dependencies once:

```sh
cd web
npm ci
cd ..
```

Open **http://localhost:5174** after starting the app below. In Rehearsal, send the example message, approve
the proposal and start the round. Use A/D or arrow keys to move and Space to
jump. Click the arena to focus controls. Rehearsal runs in browser memory and
does not create live records in PostgreSQL; reloading resets it. The app shows
the backend/database as unavailable until configured.

Check the existing environment without changing containers or running migrations:

```sh
node scripts/doctor.mjs
```

Use the host port published by your existing PostgreSQL 18 container. Prepare
dedicated `ruleshift_live` and `ruleshift_live_test` databases within that server;
[the PostgreSQL 18 setup guide](docs/POSTGRES-18.md) covers port discovery and
one-time setup. The launcher does not create, restart or modify Docker services.

Configure the backend privately:

```sh
cp backend/.env.example backend/.env
```

Edit `backend/.env` locally with your database URL and Twitch app credentials.
Example **configuration shapes**, with placeholders rather than credentials:

```dotenv
DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:HOST_PORT/ruleshift_live?sslmode=disable'
TEST_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1:HOST_PORT/ruleshift_live_test?sslmode=disable'
HTTP_ADDR='127.0.0.1:8080'
WEB_ORIGIN='http://localhost:5174'
TWITCH_CLIENT_ID='YOUR_APP_CLIENT_ID'
TWITCH_CLIENT_SECRET='YOUR_APP_CLIENT_SECRET'
TWITCH_REDIRECT_URI='http://localhost:8080/auth/twitch/callback'
```

Replace `HOST_PORT` with the actual published host port. URL-encode special
characters in credentials. The `.env` file is ignored by Git. The launcher reads
it as data, without executing shell commands, then starts Go and Vite together:

```sh
node scripts/dev.mjs
```

For a live session, `node scripts/dev.mjs --live` requires database and Twitch
app configuration before launch. Use Ctrl+C to stop both owned child processes.
Backend credentials are not passed to Vite. OAuth still requires interactive
consent in the browser.

The server checks the connected major version is 18 before any migration. The
initial migration runs transactionally and idempotently at startup. An unset
`DATABASE_URL` exposes status endpoints with live controls disabled; a configured
but inaccessible database causes startup to fail. There is no runtime replacement
database. `/healthz` returns 503 when PostgreSQL is unavailable.

Use `localhost` consistently in the browser and OAuth settings so the state
cookie returns to the same host. Keep one backend instance and one controller
tab. Reloading a live controller does not reconstruct player movement; stop the
existing round and start a new approved proposal.

After a live round, keep the controller open until the result says **Saved to
PostgreSQL**. The final score is sent separately from periodic telemetry so a
last-second coin is not lost. A lost acknowledgement can be retried with the
same payload. Pending delivery stays in this tab's memory; reloading or closing
the tab can lose it. Recovery accepts a final report until 30 seconds after the
server deadline; older unconfirmed results remain downloadable locally.

**Download round record** exports the rule, author, originating message ID,
outcome and last 64 observed controller events, with a dropped-event count.
Rehearsal files are `LOCAL_REHEARSAL` and browser-only. Twitch files are
`TWITCH_CONTROLLER_RECORD` and require manual live verification; their JSON
does not certify Twitch delivery or turn local scores into trusted scores.

## Real Twitch verification

Follow [the live verification runbook](docs/LIVE-VERIFICATION.md). Register an app
with the exact callback above, connect your own broadcaster account through the
dashboard, and send the example from your channel's real chat. The implementation
requests only `user:read:chat`. OAuth tokens stay in backend memory; restart or
revocation requires reconnection. The app does not send chat replies.

Twitch's [EventSub WebSocket documentation](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/)
requires keepalive monitoring and distinguishes server-directed reconnects from
lost connections. This adapter retains the old socket until the new welcome on
a directed handoff and re-subscribes after connection loss. The UI explicitly
shows gaps: Twitch does not replay messages lost while disconnected.

## Checks

```sh
cd backend
go test -race ./...
go vet ./...
```

```sh
cd web
npm test
npm run build
```

The PostgreSQL 18 integration test is opt-in; create a separate database named with
an `_test` suffix and set `TEST_DATABASE_URL` privately before running Go tests.
It creates and removes a unique schema, never application tables. It is skipped
when the test database is unavailable; a skip is not integration evidence.

For browser rehearsal checks on a machine allowed to run local servers, keep
Vite running and install Google Chrome, then run `npm run test:browser` in `web/`.
Use `CHROME_PATH` for another Chromium executable. The script checks approval,
movement-triggered reversal, automatic restoration, stop, unsupported proposals,
source separation, horizontal overflow and captures desktop/mobile images under
`.local/browser-evidence/`. **This browser script has not run in this sandbox.**
It also checks that a downloaded rehearsal record remains labeled browser-only.

`node scripts/verify.mjs` runs all four checks and loads configuration from the
backend `.env`. It also records a synthetic EventSub → Go approval → actual
TypeScript engine trace under `docs/evidence/vertical-slice.json`. That trace is
protocol-fixture evidence, not a real Twitch message or PostgreSQL run.

See [architecture](docs/ARCHITECTURE.md), [progress](docs/PROGRESS.md),
[verification evidence](docs/VERIFICATION.md), and
[Codex evidence](submission/CODEX-EVIDENCE.md).

## Next gates

Prove the real Twitch → PostgreSQL → approval → game → expiry flow before adding
AI interpretation, an actual game preview, jump/temporary-platform mechanics or
an OBS overlay. No provider model, budget or paid API access is assumed. OBS will
need to consume the controller's active state rather than run another simulation.
The local score is untrusted and is not suitable for monetary prizes.

Submission target from the brief: November 2, 2026, 21:00 WIB. Submission materials
and UI are in English. Video, live playtest and competition submission are pending.
