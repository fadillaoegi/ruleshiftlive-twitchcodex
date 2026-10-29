# Codex development evidence

RuleShift Live was initiated in Codex on October 29, 2026, from the user's
handoff and competition analysis. Session identity is recorded below by the
implementation session without copying private transcript contents or secrets.

## Work log

- Inspected the empty workspace, original research, local toolchain and access.
- Identified missing Twitch/provider credentials, unavailable PostgreSQL access,
  occupied frontend port and restricted terminal networking.
- Created the scoped project, architecture instructions and milestone plan.
- Implemented Go domain/use-case boundaries, PostgreSQL migration/repository,
  local HTTP control, Twitch OAuth and EventSub adapter lifecycle.
- Implemented the React approval flow, credential-free labeled rehearsal and
  Canvas physics from the same validated conditional rule definition.
- Applied the user's mid-session pixel retro cyberpunk design direction using
  original bitmap lettering, sprites, neon panels and a code-rendered skyline.
- Wrote behavior tests, fixed an integer-overflow edge case in duration parsing,
  allowed OAuth's cross-site return through state validation, and fixed coin
  reachability after effect expiry for all supported trigger frequencies.
- Ran Go race tests and vet, 13 web tests and the production build. Actual exits
  are saved in `../docs/evidence/local-checks.json`; the PostgreSQL test skipped.
- Attempted both preview servers and recorded sandbox bind denials. No live
  Twitch, browser, database or OBS evidence is implied by successful local tests.
- On continuation, incorporated the user's existing PostgreSQL 18 Docker target;
  added a read-only inspector, pre-migration version check, redacted preflight
  report, safe `.env` loader and a single-command Go/Vite launcher. Docker access
  remained denied, and no existing containers/volumes were changed.
- Added and ran a cross-runtime synthetic chat-to-physics test, preserving a
  `PROTOCOL_FIXTURE` trace in `../docs/evidence/vertical-slice.json`.
- Fixed bounded HTTP waits, stale connection messaging, OAuth return mode and
  the successful-Start/failed-refresh edge case. Latest checks: 29 Go tests
  including subtests and 19 web tests passed, alongside vet and build. Real
  PostgreSQL 18, Twitch and browser/OBS verification remain pending.

## Session identity and reproducibility

[`codex-session.json`](codex-session.json) contains the actual `CODEX_THREAD_ID`
and `CODEX_SESSION_ID` observed in the primary implementation environment. It
contains no OAuth credentials or private transcript. Local Git history preserves
the initial implementation. No remote repository was created or pushed.

Run `node scripts/verify.mjs` from the project root to regenerate the local
verification summary. The broader status and pending live gate are recorded in
`../docs/PROGRESS.md` and `../docs/LIVE-VERIFICATION.md`.

## Capture plan

Record a short clip of this Codex thread implementing and testing the rule
lifecycle, then show real Twitch chat → approval → game trigger → effect expiry.
Keep tokens, client secrets and `.env` files outside the recording. Label any
rehearsal and protocol fixtures explicitly. No real Twitch video exists yet.
