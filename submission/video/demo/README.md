# RuleShift Live — submission video

**A newer narrated/subtitled 02:42 edit is in [`../final/`](../final/README.md).** This folder retains the earlier clean edit and its separate narration text.

## Primary delivery — actual Twitch broadcast and application demo

Use **`ruleshift-demo.mp4`**, a **158.5-second (02:38.5), 1920×1080/60 fps**
Remotion edit. It includes **eight seconds of the actual Twitch broadcast**, the
verified real Twitch-source application demo, genuine Codex development footage,
and original 3D opening/closing with original sound.

Read **`VOICEOVER-EN.md`** for timed spoken narration, or **`VOICEOVER-EN.txt`**
for a clean reading copy. These are voice-over text, not subtitles. No spoken
voice performance is embedded. Editorial headings identify chapters and evidence.

| Timeline | Material |
| --- | --- |
| 00:00–00:06.5 | Original Remotion 3D opening |
| 00:06.5–00:14.5 | Actual Twitch viewer recording of the app broadcast |
| 00:14.5–00:28 | Actual product overview |
| 00:28–00:40 | Real Twitch message attribution and approved proposal |
| 00:40–00:59 | Review rule and start; proposal approved before filming |
| 00:59–01:13 | Third coin reverses actual gravity; automatic expiry |
| 01:13–01:24 | Continued play and retrigger in the same round |
| 01:24–01:34 | Automatic 75-second round end; editorial cut skips waiting |
| 01:34–01:46 | PostgreSQL confirmation and round record download |
| 01:46–01:59 | Unsupported rule in explicitly labelled local rehearsal |
| 01:59–02:21 | Actual Codex development/check recording |
| 02:21–02:33 | Actual engine source and recorded checks |
| 02:33–02:38.5 | Original Remotion 3D closing |

The eight-second Twitch segment is an actual recording from broadcast
`316248581225` on October 31. It shows the app in its idle state, its broadcaster
camera and actual Restream layout. Public streaming was separately confirmed by
Helix and visual inspection. The original capture viewport did not include the
native LIVE badge; none was inserted. Unrelated recommendations and the signup
footer were cropped out. The broadcast is labelled earlier in this session.

**The gameplay close-ups are a separate verified real Twitch-source round.**
They do not claim that those physics events were observed in this broadcast.
That recorded round finished with 12 coins and four shifts; its first effect
expired after 4,002 ms. Backend state, downloaded controller events and a direct
read-only query on the existing PostgreSQL 18 database match. The proposal was
already approved before filming; narration states that explicitly. No chat-send
or approval click is invented. Mouse/keyboard testing is automated with eased
cursor paths and normal game time, without direct engine-state injection.

See `../captures/twitch-broadcast-proof.json`,
`../../../docs/evidence/twitch-browser-capture.json` and
`RULES-VIDEO-COVERAGE.md` for provenance and video-requirement mapping. The
remaining unsupported-input segment is labelled local rehearsal. The original
129.5-second archival review remains separate below.

Rebuild from the captured sources:

```sh
cd submission/video/remotion
npm run prepare:demo
npm run typecheck
npm run render:demo:edit
npm run verify:demo
```

`node scripts/render-demo-edit.mjs --reuse-verified-parts` can reuse unchanged
chapter encodes only when their layout fields and verified capture round match
the preserved previous edit. New broadcast footage is rendered with Remotion's
editorial plate; assembly verifies chapter frame counts. Final media QA and
encoded inspection frames are `verification.json` and `previews/encoded/`.

This video does not certify entrant eligibility or the whole Devpost entry.
YouTube publication, repository/judge access, final description, principal Codex
session and Devpost Submitted status remain separate tasks. No upload, paid AI
call, Git operation or new application/database setup was performed.

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
