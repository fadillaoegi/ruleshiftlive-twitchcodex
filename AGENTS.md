# RuleShift Live

Work only in this project. UI, code documentation and submission materials use English.

Stack: React + TypeScript + Vite + Tailwind, Canvas 2D, Go, PostgreSQL.
Keep Go domain independent of transport, Twitch and persistence. Application ports
point inward; infrastructure implements them. Do not replace PostgreSQL.

First milestone: real Twitch chat → bounded proposal queue → streamer approval →
every third coin reverses actual gravity for four seconds → automatic expiry.
Use a constrained parser until live credentials and provider budget are verified.
Never execute chat as code. Do not add paid API calls without authorized access.

Rehearsal, protocol fixtures and live evidence must be identified separately.
Do not claim a real Twitch milestone from fixtures or local rehearsal.
Never commit credentials, OAuth tokens, database data or full private transcripts.
Update docs/PROGRESS.md and submission/CODEX-EVIDENCE.md after meaningful work.

Checks: backend `go test -race ./...` and `go vet ./...`; web `npm test` and
`npm run build`. PostgreSQL integration checks require a real test database.

This milestone targets one local streamer and one backend process. Do not turn
it into a generic admin dashboard, multichannel service or marketplace.
