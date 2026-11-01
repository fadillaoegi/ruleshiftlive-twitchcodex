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
| Real Twitch OAuth / EventSub connection | Passed — user consent and backend connected state observed |
| Real Twitch chat → PostgreSQL proposal | Passed — controlled chat message and matching stored proposal observed |
| Real Twitch proposal → approval → playable round | Passed — new real-source round recorded with 12 coins, 4 shifts and saved result |
| Real-source effect timing evidence | Passed — first third-coin effect restored gravity after 4,002 ms; downloaded trace and video |
| Real PostgreSQL 18 migration/integration | Passed — PostgreSQL 18.4, isolated test database; see October 30 continuation |
| Local rule/game behavior | Passed — 13 engine/contract tests |
| Frontend transport failure handling | Passed — 6 tests |
| EventSub protocol fixtures | Passed — synthetic, not live evidence |
| Backend → actual game engine | Passed — cross-runtime protocol fixture, not live |
| Final-score retry and round records | Real final acknowledgement/record passed; failure/retry scenarios remain locally tested |
| AI inference | Not implemented; provider access/budget unverified |
| Browser rehearsal | Passed — Chrome desktop/mobile with approved local access |
| OBS and 720p live playtest | OBS livestream and 720p readability unverified; actual Twitch browser recording captured |

The first live milestone's core chat → stored proposal → approval → actual
gravity → automatic expiry flow is now verified by a real-source browser
recording, controller trace and matching PostgreSQL result. Extended live Stop,
failure/retry and OBS checks remain distinct; see the latest October 30 entry.

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

## Continuation — private configuration and explicit live prerequisites

The user reserved repository management for themselves. This is now recorded
in `AGENTS.md`: file edits and checks are permitted; commits, staging, branches,
remotes, pushes and history changes require an explicit user request. No Git
commands were run in this continuation.

Rechecked the existing Docker access and credential presence. Docker still
returns permission denied, ports 8080/5174 cannot be opened (`EPERM`), Twitch DNS
is unavailable, and no database/Twitch credentials are set. The actual redacted
preflight was refreshed in `docs/evidence/environment.json`.

Created the previously absent `backend/.env` with exclusive-create semantics,
mode `0600`, known local HTTP/OAuth defaults and empty credential fields. The
existing ignore rules already exclude this file. Existing configuration would
have been preserved rather than overwritten. No secret values were invented,
printed or copied from unrelated applications.

The next required input is either the path to an existing authorized connection
configuration or privately populated database/Twitch fields in `backend/.env`.
Actual live execution also requires runtime access to Docker/localhost/Twitch.
Gameplay code was not expanded to bypass this gate, and unchanged tests were
not rerun merely to repeat their prior passing results. The first live milestone
remains incomplete; the last verified code results remain 35 Go tests including
subtests, 29 web tests, vet and production build.

## 2026-10-30 — startup configuration consistency

Refreshed the actual preflight: Docker socket access remains denied, local
listeners return `EPERM`, terminal Twitch DNS is unavailable, and the four
database/Twitch credential fields remain empty. A previous attempt to request
Docker access outside the sandbox was rejected by this session's approval
policy. No further escalation was attempted, and no container was changed.

Review identified a local readiness gap: doctor checked fixed ports even when
the launcher used custom ports, while a mismatched OAuth hostname/port could
lose its state cookie or miss the callback route. Added shared startup validation
for both entry points, checked the exact local callback shape before launch,
and derived its default from the configured browser hostname and backend port.
Doctor now probes the configured listener addresses and fails on occupied ports
as well as sandbox-denied ports. Errors never echo configuration values.

Added four behavior tests covering defaults, custom ports/IPv6 loopback,
callback mismatch rejection and redacted invalid-input failures. The verifier
now includes these startup tests. Latest full verification passed: **4 startup
tests, 35 Go tests including subtests, 29 web tests, Go vet and production build**.
The PostgreSQL integration test remains explicitly skipped. An actual custom-port
preflight checked 8091/5190; it reported the same sandbox denials without saving
those overrides to private configuration. The default report is preserved in
`docs/evidence/environment.json`.

Updated setup instructions to preserve an existing private `.env` when copying
the example. No Git commands were run. No new gameplay scope was introduced.
The next live step still requires privately populated `backend/.env` and a local
session permitted to access the existing PostgreSQL 18 container, listen on
localhost and reach Twitch; then follow `docs/LIVE-VERIFICATION.md`.

## 2026-10-30 — existing PostgreSQL connected and browser rehearsal verified

Docker inspection found the active PostgreSQL 18 target at
`deliverpay-postgres-1` (`postgres:18-alpine`, `127.0.0.1:5438`); SQL confirmed
server version **18.4**. The other `postgres:18` container was stopped and was
left untouched. With approved Docker access, verified the RuleShift role and
database names were unused, then created a limited `ruleshift_live` login and
separate `ruleshift_live` / `ruleshift_live_test` databases. Generated a new
project password and wrote only the two connection URLs into ignored
`backend/.env`, preserving mode `0600` and all other fields. Existing project
roles, credentials, containers and volumes were preserved. No Git commands ran.

Restricted sandbox checks still denied Docker/loopback/DNS access. Repeated the
preflight and full verifier with approved runtime access: Docker reachable,
8080/5174 available before launch, Twitch DNS resolved, application database
connected. **All 4 startup tests, 36 Go tests including subtests (23 top-level),
29 web tests, Go vet and production build passed with no skipped Go tests.**
The actual PostgreSQL integration test created/migrated a temporary schema in
`ruleshift_live_test`, exercised persistence and immutable finalization, then
removed that schema. Its chat input was synthetic, not live Twitch evidence.

Started the standard local launcher with database configuration. Application
migration/startup succeeded, Vite listens at 5174, Go at 8080, and `/healthz`
returns PostgreSQL `ok`. Chrome browser rehearsal also passed: approval/start,
movement to the third coin, gravity reversal, automatic effect expiry, stop,
rehearsal record download, unsupported proposal rejection, source separation,
no horizontal overflow at desktop/mobile sizes, and no page JavaScript errors.
Inspected full-page desktop/mobile images; saved redacted evidence under
`docs/evidence/browser-rehearsal.json` and `docs/evidence/browser/`.

Remaining live gate: `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are still
missing. Populate them privately in `backend/.env`, register the exact callback
`http://localhost:8080/auth/twitch/callback`, restart with `--live`, and follow
`docs/LIVE-VERIFICATION.md`. Real Twitch OAuth/chat, OBS recording and stream
readability remain pending. No paid provider calls were made.

## 2026-10-30 — private Twitch app configuration and live startup

Installed the user-provided Twitch app credentials only in ignored
`backend/.env`. Preserved the database configuration, mode `0600`, and existing
ignore rules; no credential values were included in logs or evidence. Stopped
the launcher owned by this session and restarted it with `--live`.

Approved preflight now passes: PostgreSQL 18.4 connected, both database URLs and
Twitch app fields set, Twitch DNS resolved, and 8080/5174 available before
restart. The running backend returns PostgreSQL health `ok`, bootstrap reports
`twitch_configured: true`, and the OAuth start route returns HTTP 303. The
adapter state remains `disconnected`, awaiting broadcaster consent in the
browser. No proposals or active round were present at this readiness check.

This is configuration/startup evidence only. App field presence and a redirect
do not validate the secret with Twitch or prove OAuth, EventSub subscription or
real chat delivery. Next: open `http://localhost:5174`, select Twitch live,
connect the broadcaster account, authorize, and follow the live runbook.
Unchanged application tests were not repeated; the prior passing database,
application and browser-rehearsal checks remain separately documented. No Git
operations, database container changes or paid provider calls were performed.

## 2026-10-30 — favicon matches the application logo

Added `web/public/favicon.svg` using the existing pink square, light border and
lightning symbol. The document favicon and header now reference this same asset,
so the browser tab and page logo stay aligned. Preserved the header sizing,
pixel shadow and accessible home-link name; its image is decorative.

Validation: all 29 web tests and the production build passed. Confirmed Vite
serves the SVG and the build copies the same asset with its HTML reference.
Chrome rehearsal passed again at desktop/mobile sizes, and the updated desktop
header was visually inspected. No backend behavior or live Twitch evidence was
changed. No Git operations were performed.

## 2026-10-30 — real Twitch OAuth and EventSub connection observed

After the user completed browser authorization, both their controller screenshot
and actual `/api/state` reported Twitch `connected` for the authorized channel.
PostgreSQL remained connected; there were no proposals and no active round.
In the adapter, connected state follows successful token exchange/validation,
WebSocket welcome and EventSub subscription response. Saved a bounded status-only
snapshot as `docs/evidence/twitch-connection.json` (`REAL_TWITCH_CONNECTION`),
without credentials, tokens, OAuth state or chat text.

This establishes a real connection, not the full milestone. The next step is a
real `!rule Every third coin flips gravity for 4 seconds` chat message, persisted
proposal, streamer approval, playable round, third-coin reversal, automatic
restoration and confirmed final storage. Rehearsal/fixture records remain separate.
No application code changed and no tests were repeated for this observation.

## 2026-10-30 — real Twitch chat persisted as a pending proposal

The user sent the controlled third-coin/four-second rule in their real Twitch
channel, then showed the controller proposal labeled `TWITCH MESSAGE / PENDING`.
The backend reported connected and returned proposal
`d2241e017ab1149bcd377be6f4727419` for Twitch message
`5a4b86e3-ca97-4d68-aa6d-bd9efcde1530`, parsed as every 3 coins reversing gravity
for 4,000 ms. A read-only SQL query against `ruleshift_live` in the existing
PostgreSQL container confirmed that same ID, message ID, source, pending status
and rule. Saved bounded metadata in `docs/evidence/twitch-intake.json`; no full
chat transcript, tokens or credentials were captured.

This proves real chat intake and PostgreSQL persistence, with explicit streamer
approval still required. The channel was offline in the user screenshot; no
on-stream/OBS demonstration is claimed. The full milestone remains pending
approval, gameplay reversal/expiry, stop/round completion and saved result.
No code changes, Git operations or repeated tests were needed for this observation.

## 2026-10-30 — real-source playable round completed and saved

The user played the approved real Twitch proposal and supplied a controller
screenshot showing 45 coins, 15 shifts, zero time remaining and normal gravity.
They confirmed the game was playable. Backend state and a separate direct
PostgreSQL query matched finished round `ebc37eec6464a2f97f0a20b6cb6833b3`, linked
to the previously verified real chat proposal/message. The 75-second round ran
from 11:25:09.255166 UTC to 11:26:24.255166 UTC and saved its controller-reported
45 coins at sequence 76 with `result_saved=true`. Saved bounded result evidence
under `docs/evidence/twitch-round-result.json`.

Real chat intake, explicit approval, playable gameplay and stored completion
have now been observed. The static screenshot does not establish individual
four-second effect expiry; obtain the controller's Download round record and
inspect its reversal/restoration timestamps before closing that evidence gate.
Scores remain untrusted. Real-source Stop demonstration, OBS video and 720p
stream readability remain unverified. Keep the controller tab open to preserve
its in-memory event record. No code or Git changes were needed for this check.

## 2026-10-30 — Devpost submission readiness audit

Checked the official rules, submission overview, FAQ and schedule, and compared
them with actual project artifacts. Saved `submission/SUBMISSION-READINESS.md`.
Core Twitch/Codex functionality is demonstrated, but final submission readiness
is not established: no final YouTube demo, Devpost description, submission repo
URL/judge access or Submitted status was verified. Participant eligibility,
ownership and third-party permissions need entrant confirmation. Existing
English UI/docs and test evidence support the entry but do not replace those
materials. The initial saved Codex thread differs from this continuation; use
the thread containing the main build for the submitted session identifier.

The official November 2, 2026 14:00 PST cutoff converts to November 3 at 05:00
WIB using the relevant IANA zones. The November 2 at 21:00 WIB target remains
internal. Noted inconsistent FAQ UTC conversion and judging dates across pages;
the Official Rules govern. No runtime AI, overlay, multiplayer or hosted website
requirement was identified. JSON effect-trace review is our validation task,
not an organizer-mandated submission file. No Git, publishing, gameplay changes
or repeated tests were performed for this documentation audit.

## 2026-10-30 — standard repository ignore rules

Expanded `.gitignore` to cover standard repository exclusions for Go, Node/Vite,
TypeScript, Playwright, PostgreSQL dumps/volumes, rendered video/audio media,
Remotion caches, logs, OS metadata, IDE directories and private credentials or
transcripts, while keeping `.env.example`, SQL migrations, source code and
redacted evidence files trackable. No Git commands were executed.

## 2026-10-30 — Remotion 3D intro and closing with original sound

Created the user-requested video graphics in `submission/video`, using Remotion
as explicitly requested. The isolated `remotion/` project pins Remotion 4.0.539,
React Three Fiber and Three.js with its own dependency lock, leaving application
dependencies unchanged. Both compositions are 1920×1080 at 60 fps: a 6.5-second
intro and 5.5-second closing, plus a 12-second review montage.

Authored an original 3D neon arena, camera dolly/roll, fog, particles, embossed
rotating coins, gravity pulse and extruded lettering derived from the app's
5×7 glyphs. Reused the existing pink lightning logo and palette. Generated
original stereo synth pads, tuned coin chimes, sub impacts and gravity sweeps
with deterministic code; supplied WAV stems alongside AAC audio in the MP4s.
No stock media, third-party music recordings or paid generation APIs were used.

Resolved an initial WebGL postprocessing capture issue before final delivery;
the final render uses frame-derived animation and a synchronous drawing pass.
TypeScript passed. FFprobe confirmed dimensions, frame rates, frame counts and
stereo 48 kHz audio. Both final clips and the review montage fully decoded in
FFmpeg. Encoded audio peaks were -2.3/-2.2 dBFS. Visually inspected frames
extracted from the encoded files, including coins, the title and closing CTA.
Actual output metadata and QA are under `submission/video/render-info.json`
and `submission/video/verification.json`; editing instructions are in its README.

These are branding graphics, not real Twitch gameplay evidence or a complete
submission demo. Real application/Codex footage still belongs between them.
No Git operations, live-session reset, application code changes or unrelated
application tests were performed for this media task.

## 2026-10-30 — application screen demo and timed narration text

Prepared a 129.5-second English review edit under `submission/video/demo`,
using Remotion for the editorial composition and original 3D graphics, with
FFmpeg compositing the actual screen captures at normal speed. Supplied timed
Markdown and clean-text English voice-over scripts separately; no spoken
narration or subtitles are embedded. Intro/closing retain original stereo sound.

Recorded the running application through actual browser UI input: product
overview, approval, third-coin reversal, real-time effect expiry, a later Stop,
browser-only result and an unsupported proposal. Capture manifests explicitly
classify this as local rehearsal, not fresh Twitch evidence. Eased cursor paths
and scrolling are automated UI testing, with no claim of a human operator.
No network fixtures, clock acceleration or direct engine-state injection were
used. Downloaded media and encoder tails can hold the final captured frame;
the edit never advances gameplay through a fabricated state.

Recorded an actual Codex window inspecting `engine.ts`/`parser.go` and running
`node scripts/verify.mjs`; all startup, Go race/integration, vet, web test and
build checks passed. Cropped native footage to the relevant project area;
the delivered excerpt excludes browser chrome, unrelated window areas and
credentials. Actual source/check-result panels are labelled read-only evidence,
not a synthetic Codex interface. App source and database configuration did not
change. No Git operations or publication occurred.

A bounded wait for a fresh controlled real Twitch proposal ended without one.
The old real round is finished, and the latest connection check requests
reauthorization. Therefore the review edit uses the user's earlier real chat,
pending-proposal and completed-round screenshots with explicit archival labels.
It does not establish exact expiry timing for that earlier real Twitch round.
The capture script for a new live sequence is ready, but a fresh message and
connected session are needed before that dependent work can run. It never
sends a Twitch message itself or resets a consumed proposal. The live milestone
evidence gate and final continuous Twitch video remain open.

Remotion TypeScript passed. The media QA script checks the complete encoded
file, frame count, sub-three-minute duration, 1080p/60 fps format, stereo AAC,
subtitle absence and audio headroom, and extracts final-file QA frames. The
delivery README explains provenance, reproduction, the voice-over track and
remaining YouTube/Devpost requirements; this review edit is not compliance
certification or a published competition entry.

Final review media QA passed: 129.5 seconds, 7,770 frames, H.264 1920×1080
at 60 fps, AAC stereo 48 kHz, no subtitle stream, -2.2 dBFS audio peak and
complete FFmpeg decode. Corrected a short encoder tail by holding the captured
result frame so narration chapter boundaries remain exact. Inspected frames
extracted from the final MP4 for third-coin reversal/restoration, Stop, archival
chat/proposal/result, actual Codex/source and intro/closing. This sampled visual
inspection is recorded separately from codec validation.

On the user's follow-up that the message was sent, the actual backend still
reported `reauthorize`, zero pending proposals and the old finished round.
Reopened the existing OAuth flow and confirmed `connected`; messages sent
during the disconnected interval are not replayed. Requested one fresh
controlled message after reconnect and armed the bounded capture watcher.
No new real-source recording is claimed while the queue remains empty.
Prepared a read-only live audit script to match a future controller record to
PostgreSQL and validate its first effect interval. The edit now preserves the
whole initial trigger/expiry shot and rejects timelines at or above three
minutes. Those media scripts passed syntax checks; application code is unchanged.

## 2026-10-30 — actual Twitch round recorded and submission demo delivered

The user's new message arrived as proposal `93cba8988259cbe19bb2690dfe121870`,
message `cacefab2-7bf9-43a6-b33a-c60033401947`. It was already approved before
the successful capture began. Adapted the capture to use that unused approved
proposal without resetting it or inventing another click; narration discloses
the approval timing. The earlier attempt waiting for pending status timed out
and was not used as completed evidence. Reconnected the actual OAuth session
before the successful recording; no Twitch messages were sent by tools.

Recorded real round `56229fde4cf8185ab948448b147755bb` from UI Start through
the real 75-second deadline, result acknowledgement and UI record download.
It ran from 21:12:04.165998 to 21:13:19.165998 WIB, with 12 coins, four shifts,
finished status, sequence 76 and `result_saved=true`. The first third-coin
reversal at 14:12:10.070 UTC expired at 14:12:14.072 UTC: 4,002 ms. Coin 12
refreshed the coin-nine effect; normal gravity returned 4,003 ms after that
retrigger. All 20 bounded controller events were retained. A direct read-only
PostgreSQL query and backend state match the controller's source/message/round
IDs, result and sequence. Saved bounded evidence in
`docs/evidence/twitch-browser-capture.json`.

This verifies the first milestone's core real chat → persisted proposal →
approval → actual gravity → expiry loop, including automatic round completion.
Controller timestamps are client observations and scores remain untrusted.
Real-source Stop/failure-retry, rapid-message cooldown and OBS livestream/720p
checks remain unverified; rehearsal and protocol fixtures remain distinct.

Delivered `submission/video/demo/ruleshift-demo.mp4`, 150.5 seconds (2:30.5),
with actual Twitch-source proposal/start/physics/expiry/retrigger/result,
separately labelled unsupported-rule rehearsal, real Codex footage, actual
source/check results and the original Remotion 3D opening/closing. Supplied
matching timed English `VOICEOVER-EN.md` and a clean `.txt`. No voice performance
or subtitles are embedded. Natural cursor paths and keyboard input are automated
UI testing; no human operator, synthetic chat, accelerated clock, fake Codex
interface or on-stream OBS footage is claimed.

Remotion TypeScript passed. Final media QA passed: exactly 9,030 frames,
1920×1080/60 fps H.264, 150.5 seconds, 48 kHz stereo AAC, -2.3 dBFS peak,
no subtitle stream and complete error-free decode. Sampled encoded frames were
inspected for live proposal, reversed/restored gravity, automatic end, saved
result, unsupported input, Codex and source. The earlier 129.5-second review and
its scripts/QA frames remain separate. Updated README, live runbook and
submission readiness to reflect the new evidence. No application code changes,
new paid calls, Git operations or external publication were performed. YouTube,
entry metadata/eligibility, principal Codex session and final Devpost submission
are still separate requirements.

## 2026-10-31 — on-stream recording preparation

Prepared `submission/video/stream-setup/` for the user's requested Twitch
viewer-page/stream-start segment. Their screenshot shows OFFLINE; a real
read-only Helix Get Streams check at 05:44:35.842 UTC also found `fldevboo`
offline. Credentials/app token stayed in memory. No broadcast, chat message,
approval or round was started by tools.

Opened OBS 32.2.2 and a dedicated actual Chrome controller window with a
project-private profile and loopback-only debugging. Its snapshot truthfully
reports reauthorization needed. Exported two OBS scenes, Starting Soon and
Arena, targeting that actual controller through macOS Screen Capture. No
microphone or stream credentials are included. The window ID is session-specific.
Existing OBS scenes/profile were not overwritten. Accessibility access was not
granted and OBS WebSocket control was disabled; import/account connection and
actual OBS capture still require user action and verification.

Delivered an editable Remotion 18-second layout preview with original 3D
branding, the actual idle controller screenshot and a privacy-cropped offline
Twitch reference. It is explicitly labelled not broadcast. No LIVE badge, player,
viewer count, chat arrival or approval was fabricated. The previous verified
150.5-second actual-Twitch-chat demo remains intact; its SHA256 still matches.

TypeScript and preview QA passed: 1,080 frames/18 seconds, H.264 1920×1080/60 fps,
no audio/microphone track, complete decode, existing scene asset references and
transparent overlay. Sampled encoded frames were inspected. Import instructions,
status/QA metadata and a proposed replacement edit with conditional English
narration are included. Genuine native Twitch player/chat footage and a new
on-camera approval depend on OBS setup and the user's decision to start a public
stream. No application/database changes, paid AI calls, Git operations or public
publication occurred; application tests were not repeated for media-only work.

The online-stream follow-up preflight at 06:19:40.977 UTC still found the
channel offline. OBS has only the original Untitled collection and no configured
stream service; the RuleShift scene has not been imported. Opened OBS and
revealed the prepared scene file for the user's direct account connection/import.
No broadcast was started or password/stream key requested in chat. Account
connection and a verified OBS preview remain necessary before streaming.

## 2026-10-31 — actual browser-based Twitch broadcast

The user started Restream Studio sharing their actual RuleShift Chrome tab.
Read-only Helix verification at 08:38:27.944 UTC confirmed active broadcast
`316248581225`, started at 08:32:38 UTC. An independent public Twitch viewer
visually showed the real controller, Restream layout and native LIVE badge.
Earlier offline checks remain historical; OBS was not used for this broadcast.

Prepared read-only public-viewer recording helpers with wall-clock encoding and
bounded backend observations. Raw footage stays private in
`.local/live-broadcast/` until cropped, reviewed and verified. Helpers never send
chat, approve rules or operate the user's shared game. Syntax checks passed.

At 09:04:42 UTC, Twitch and PostgreSQL were connected but no fresh controlled
proposal or new round had arrived during capture. The user received the manual
approval/play/download steps. A new on-stream gameplay sequence and replacement
Remotion edit remain pending; the existing verified 150.5-second demo is intact.
No Git, database setup, paid API or external video publication changes occurred.

Shared-tab automation preflight: regular Chrome rejects JavaScript from Apple
Events, so it cannot currently be driven directly. Prepared and visually checked
the isolated headful window titled `RuleShift Live — Demo controller`, with the
whole arena visible and actual Twitch/PostgreSQL connection restored. The user
was asked to switch Restream's shared source to that window and send the fresh
rule from their logged-in Twitch account. Approval and gameplay remain pending
until that source switch is confirmed; a separate unshared game is not evidence
of broadcast gameplay. No system automation preference was changed.

The user's new real Twitch proposal `2cd91137920ab45497dfaa1c3a285cc7`
arrived at 09:36:49 UTC and remains pending. The isolated capture browser had
closed, so it was reopened. A read-only scroll probe showed the proposal queue
in the controllable window while the independent broadcast still showed the
initial header/arena view. Asked the user to reselect the reopened controller
under Window in Restream; no duplicate message is required. Both actual viewer
and controller capture helpers are armed. Prepared the existing-headful UI
driver separately from the previous headless capture; it requires confirmed
sharing and never closes the user's browser. No approval or new round has been
performed pending source matching.

## 2026-10-31 — final short broadcast excerpt and voice-over edit

Delivered the user's requested short live-streaming proof inside the Remotion
demo: eight seconds of actual public Twitch viewer recording from broadcast
`316248581225`, followed by the prior verified real Twitch-source gameplay and
actual Codex footage. The broadcast clip is labelled earlier in this session
and shows the idle app. No corresponding gameplay-on-broadcast claim is made.
The latest Helix check at 10:27:52 UTC found the channel offline; the edit uses
the previously recorded active broadcast, without generating a LIVE badge.

A fresh close-up capture attempt stopped at the approved-proposal browser
locator and never started a round. It is retained privately as incomplete. The
previous verified capture, trace and edit were preserved, and the completed
source capture was restored. No failed attempt is presented as completed live
evidence. The new October 31 proposal remains distinct from the recorded round.

Final movie: `submission/video/demo/ruleshift-demo.mp4`, 158.5 seconds,
9,510 frames, H.264 1920×1080/60 fps, AAC stereo 48 kHz, peak -2.3 dBFS,
no subtitle stream and complete error-free decode. Remotion renders the new
editorial plate; unchanged verified chapter encodes are reused after capture
identity/layout checks. Original 3D opening, closing and original synth sound
remain. Timed `VOICEOVER-EN.md` and clean `VOICEOVER-EN.txt` match the edit;
no voice performance is embedded. Encoded broadcast, gameplay, result, Codex
and closing frames were visually inspected.

Remotion TypeScript, script syntax, final media QA and a repeat read-only
PostgreSQL/controller audit passed (same round: 12 coins, four shifts, first
expiry 4,002 ms). Updated source/provenance and official-video-requirement
mapping. Official rules and overview were rechecked. YouTube publication,
repository/judge access, final entry fields and eligibility are not completed
by making this video. No application code, paid API, database setup or Git
operation was performed.

## 2026-11-01 — narrated, subtitled Remotion final demo

Completed `submission/video/final/ruleshift-demo-final.mp4`: 162 seconds
(02:42), 9,720 frames, H.264 1920×1080/60 fps with AAC stereo 48 kHz.
The user's eleven supplied MP3 voice recordings are now embedded. Original
96 BPM neon/sci-fi music includes pads, arpeggios, bass, restrained percussion
and synchronized diagram accents; a speech-controlled sidechain lowers the
backsound during narration. The final encoded mix measures -16.01 LUFS and
-3.3 dBFS true peak. No paid music, TTS or transcription API was used.

Remotion adds a seven-second informative 3D diagram: three coin triggers,
a four-second reversal countdown, and automatic restoration. New editorial
side panels explain chat → review → play → save. Actual Twitch broadcast,
verified Twitch-source controller footage, local rehearsal and the illustrated
diagram stay distinctly labelled. The public excerpt shows the idle app; it
is not claimed to show the separate recorded gameplay round.

Local whisper.cpp word timings were aligned to the supplied script, with
98.22–100 percent reference alignment. The 41 English subtitle cues are
burned into a dedicated lower area and also supplied as SRT/VTT. Audio
originals and hashes were preserved. Public word timings allow regeneration
without a model download. A 16.67-second mixed-speech transcription spot-check
matched the expected narration at 99.77 percent.

Visual QA found a mixed-timebase concatenation issue before delivery. Every
chapter is now remuxed to the same MP4 timebase and its duration/frame count
checked before assembly. The resulting complete picture and encoded movie
are both exactly 162 seconds at 60 fps. Full decode, Remotion typecheck,
script syntax, narration-file hashes, complete subtitle script, cue bounds
and final loudness checks passed. Final encoded frames were inspected for
all major evidence types, diagrams, caption readability and chapter order.
`verification.json` records the output hash and measurements.

The package includes the final MP4, original music and narration/mix WAV
stems, subtitle sidecars, timed narration, edit plan, source/QA metadata and
editable Remotion compositions/scripts. Earlier clean/review videos remain
separate. Official video rules were rechecked; this movie is under the
three-minute limit and includes Twitch and genuine Codex footage. YouTube
publication, judge repository access and final entry/eligibility details
remain separate. No Git operations, application code or database changes
were made; application tests were not repeated for this media-only change.

## 2026-11-01 — submission artwork and supporting PDFs

The entrant subsequently supplied
`https://github.com/fadillaoegi/ruleshiftlive-twitchcodex`. Unauthenticated GitHub
REST calls confirm public visibility and accessible README content. Updated
the submission copy, readiness record, link data and brief's source link.
Remote source/asset completeness and independent installation remain unverified;
no clone, Git management, publication or submission was performed.

Subsequently prepared `submission/DEVPOST-FORM.md`: English copy for the
project name, tagline, story, Codex contribution, tags, video and asset fields.
Checked official submission requirements and the public submission-management
link. Repository URL and principal-session confirmation remain entrant actions;
no authenticated fields were filled and no submission was sent. This is a
documentation-only change; application checks were not repeated.

Created original English promotional artwork with Remotion using the existing
lightning logo, original pixel sprite, navy grid and cyan/pink app palette.
Exports include a 3840 x 2160 YouTube thumbnail (plus 1280 x 720 alternative),
an 1800 x 1200 Devpost cover, and a 3508 x 4961 A3 poster. Perspective frames
contain actual verified gravity-reversal footage; decorative coins/sprites
are illustrations. Platform dimensions and JPEG byte limits were checked
against official YouTube and Devpost guidance.

Created a four-page A4 project brief and one-page A3 poster PDF in
`submission/documents/`. The brief covers interaction, constrained parsing,
actual physics, streamer control, implementation/Codex contribution, recorded
session, setup and bounded evidence. Every page was rendered with native
PDFKit and visually inspected. Embedded font subsets, page counts, text and
clickable demo/rules links passed inspection. A Devpost headline/frame
overlap was corrected before final export. Remotion typecheck passed.

Recorded the user-supplied https://youtu.be/AvWHm6U2jUs. Official unauthenticated
YouTube oEmbed returns the expected title and FLdev channel; full playback and
identity with the local final MP4 are not verified. The PDF explicitly records
that repository access still needs a URL and that the recorded implementation
session needs confirmation as the principal thread. Supporting PDFs do not
certify the complete entry or participant eligibility. No Git, application,
database or paid API changes were performed.

Native Vision decoded the QR in the final poster JPEG, rendered A3 PDF and
brief page one to the exact supplied YouTube URL. Sandbox image-processing
restrictions required approved local verification outside the sandbox.
