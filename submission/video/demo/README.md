# RuleShift Live — submission video

## Primary delivery — actual Twitch demo

Use **`ruleshift-demo.mp4`**, a **150.5-second (02:30.5), 1920×1080/60 fps**
edit with actual Twitch-source gameplay and genuine Codex footage. It replaces
the earlier review's archival gameplay section. Remotion authors the 3D graphics
and editorial layouts; FFmpeg composites the original captures at normal speed.

Read **`VOICEOVER-EN.md`** for the matching timed English narration, or
`VOICEOVER-EN.txt` for a clean reading copy. The requested voice-over is supplied
as **text**, not subtitles or a synthesized voice performance. The MP4 retains
original intro/closing sound; its screen clips contain no microphone recording.

| Timeline | Material | Evidence |
| --- | --- | --- |
| 00:00–00:06.5 | 3D opening | Original Remotion animation and synthesized sound |
| 00:06.5–00:20 | Product overview | Actual running application |
| 00:20–00:32 | Real Twitch proposal | Actual message attribution and approved proposal |
| 00:32–00:51 | Review rule and start | Actual UI; proposal was approved before recording |
| 00:51–01:05 | First third-coin reversal and expiry | Actual real-source gameplay, normal speed |
| 01:05–01:16 | Continued play and retrigger | Same real round, normal speed |
| 01:16–01:26 | Automatic round end | Later in the same 75-second round, normal speed |
| 01:26–01:38 | Saved result and record download | Actual PostgreSQL confirmation and UI download |
| 01:38–01:51 | Unsupported rule | Separate, explicitly labelled local rehearsal |
| 01:51–02:13 | Codex development/checks | Actual cropped Codex window recording |
| 02:13–02:25 | Source and check results | Actual engine excerpt and verification results |
| 02:25–02:30.5 | 3D closing | Original Remotion animation and sound |

The real round finished with **12 coins and four shifts**. Its first effect
restored normal gravity after **4,002 ms**. A retrigger on coin 12 refreshed the
coin-nine effect; gravity restored 4,003 ms after that retrigger. Backend state,
the downloaded controller trace and a direct read-only query on the existing
PostgreSQL 18 database agree on message/round IDs, score and saved completion.
See `../../../docs/evidence/twitch-browser-capture.json`,
`../captures/live-capture.json` and `../captures/live-round-record.json`.

This is automated UI testing with eased cursor paths and real keyboard input,
not a claim of a human operator. The proposal had already been approved when
filming began; the footage and narration do not invent an approval click or
claim to show the original chat-send action. No simulated Twitch response,
game-clock acceleration or direct engine-state injection was used. Editorial
cuts skip waiting and can hold the last captured frame; the entire initial
trigger/expiry shot is retained. Exact cuts and holds are in `edit-plan.json`.

Rebuild the full edit from the recorded sources:

```sh
cd submission/video/remotion
npm run prepare:demo
npm run typecheck
npm run render:demo:edit
npm run verify:demo
```

Run `node scripts/audit-live-demo.mjs` there to repeat the controller/backend/
read-only PostgreSQL evidence match. It uses only the dedicated project database
in the existing container. Full-video media QA is `verification.json`; final
encoded inspection frames are under `previews/encoded/`. The original review
and its QA remain separate below.

The English edit is under three minutes and includes working Twitch behavior
and real Codex development/checks. It does not certify all entry requirements.
Voice recording/mixing, YouTube publication, repository/judge access, entrant
eligibility, the principal Codex session ID, final description and Devpost
Submitted status remain separate tasks. Nothing was uploaded by this work.

Final media QA passed: exactly 9,030 frames/150.5 seconds, H.264 1080p/60 fps,
48 kHz stereo AAC, -2.3 dBFS peak, no subtitle stream and complete error-free
decode. Encoded-frame samples were inspected for proposal attribution,
reversed/restored gravity, automatic end, stored result, labelled rehearsal,
Codex and source. See `verification.json`.

## Earlier review cut — retained separately

`ruleshift-demo-review.mp4` is a **129.5-second review cut**, assembled with
Remotion at 1920×1080, 60 fps. It includes the original 3D intro/closing and
their original stereo sound. Screen clips contain no microphone recording.

Use `VOICEOVER-REVIEW-EN.md` for the timed English narration and
`VOICEOVER-REVIEW-EN.txt` for a clean reading copy. The requested deliverable is
spoken voice-over **text**, supplied separately. No voice performance or
subtitles are embedded. Chapter headings and evidence labels are editorial
navigation, not a transcription of the narration.

## What is actually shown

| Timeline | Material | Provenance |
| --- | --- | --- |
| 00:00–00:06.5 | 3D brand opening | Original Remotion/Three.js animation and synthesized sound |
| 00:06.5–00:20 | Product and controls | Actual Chromium recording of the running application |
| 00:20–00:39 | Twitch chat → pending proposal → finished game | Earlier user-provided real test screenshots, explicitly marked archival |
| 00:39–01:17 | Approval, gameplay, four-second expiry, Stop and result | Actual UI testing in explicitly labelled local rehearsal mode |
| 01:17–01:30 | Unsupported proposal | Actual rehearsal UI; approval is unavailable |
| 01:30–01:52 | Codex inspects source and runs checks | Actual native window recording, cropped to the relevant project area |
| 01:52–02:04 | Rule code and validation | Read-only excerpt from the actual engine and recorded check results |
| 02:04–02:09.5 | 3D closing | Original Remotion animation and sound |

The browser recording uses Playwright UI input with eased cursor paths and
scrolling. This is automated testing with natural motion; it does not claim a
human operator. No intercepted network responses, fake queue items, engine
state injection, accelerated game clock or synthetic Codex interface were used.
Cuts remove waiting/typing lead-in and occasionally hold the last frame. The
source in/out points, holds and normal playback rate are in
`edit-plan-review.json`; capture manifests are in `../captures/`.

Browser chrome, unrelated native-window areas and private credentials are
excluded from the delivered footage. Raw native-window material stays in the
ignored `.local` work area. No full private transcript is a submission asset.

## Earlier review coverage and provenance

The project audit in `../../SUBMISSION-READINESS.md` maps the organizer's
[Official Rules](https://twitchcon-codex.devpost.com/rules) and
[FAQ](https://twitchcon-codex.devpost.com/resources) to the entry. This edit is
under three minutes, uses English, explains the Twitch experience, demonstrates
working physics/streamer controls, and includes genuine Codex development and
verification footage.

**The review is historical; use the primary delivery above.** Its archival
screenshots and rehearsal do not establish timing for the earlier 45-coin
Twitch round. A subsequent user message supplied the new recorded 12-coin
round, which now has actual controller/video/PostgreSQL evidence. The channel
need not be live to send the controlled chat message.

For an additional capture, reconnect the controller's Twitch session if
requested, then send this message in the user's own channel:

```text
!rule Every third coin flips gravity for 4 seconds
```

With that proposal pending or approved, run `npm run capture:live` in `../remotion`.
The script approves if still pending, then starts through the actual UI, records the real
75-second round, waits for persistence, downloads its controller record, and
checks source attribution plus the observed effect interval. It never sends a
Twitch message itself or rewinds a consumed proposal. Then run:

```sh
npm run prepare:demo
npm run typecheck
npm run render:demo:edit
npm run verify:demo
```

A successfully completed real capture selects the separate full composition,
`ruleshift-demo.mp4`, and matching `VOICEOVER-EN.md`/`.txt`. A review source
does not silently become live evidence. The original review plan/script remain
available. Check the final duration and inspect the encoded frames before use.

Narration still needs to be recorded/mixed if desired. YouTube publication,
repository/judge access, principal Codex session selection, entrant eligibility,
final description and Devpost Submitted status remain separate tasks. No video
has been uploaded or published by this work.

## Edit and reproduce the review

Requirements: the isolated Remotion dependencies, FFmpeg/FFprobe, existing
Chrome and the recorded source media. Starting from the project root:

```sh
cd submission/video/remotion
npm ci
npm run prepare:demo -- --review
npm run typecheck
npm run render:demo:edit
npm run verify:demo
```

`scripts/prepare-demo.mjs` prepares actual footage and the timed script.
`src/demo.tsx` supplies the Remotion composition.
`scripts/render-demo-edit.mjs` renders Remotion editorial plates and uses
FFmpeg to composite the original captures at normal speed. The original 3D
brand segments were rendered with Remotion. This avoids screenshot-rendering
thousands of unchanged layout frames. `scripts/assemble-demo.mjs` keeps chapter
boundaries exact and places original intro/closing sound on a continuous audio
timeline. `npm run render:demo` remains available for a complete per-frame
Remotion render of the same composition; it is slower on this machine.
`scripts/verify-demo.mjs` checks codec, dimensions, duration, frame count, audio,
absence of subtitle streams and a complete decode, then extracts encoded QA
frames. Review media are intentionally ignored by the repository's media rules;
include the intended assets in the user-managed submission export.

The delivered review passed those checks: exactly 7,770 frames/129.5 seconds,
H.264 1080p/60 fps, 48 kHz stereo AAC, -2.2 dBFS peak, no subtitle stream and a
complete error-free decode. Sampled encoded frames were visually inspected for
reversal, restored gravity, Stop, archival chat/proposal/result, Codex, source
and branding. See `verification-review.json` and `previews/encoded-review/`.

The screenshot sources for rebuilding the archival crops are the temporary
images originally supplied in this conversation. Preserve the prepared
`public/demo/archive/*.png` files with the editable media project before those
temporary originals disappear.
