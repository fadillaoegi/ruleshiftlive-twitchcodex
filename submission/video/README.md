# RuleShift Live — Remotion opening and closing

The primary application demonstration is under [`demo/`](demo/README.md):
`ruleshift-demo.mp4`, a 150.5-second actual-Twitch/Codex edit with separately
timed English voice-over text. Its new real-source round includes observed
expiry and a matching PostgreSQL result. The earlier 129.5-second archival
review remains separate. See the demo README for provenance and QA.

Original 3D motion graphics with synchronized original stereo sound, prepared
for the RuleShift Live submission video. All on-screen copy is English.

## Deliverables

| File | Duration | Intended placement |
| --- | --- | --- |
| `ruleshift-intro.mp4` | 6.5 seconds | Before the real Twitch/application demo |
| `ruleshift-closing.mp4` | 5.5 seconds | After the demo and Codex development footage |
| `ruleshift-motion-preview.mp4` | 12 seconds | Both graphics back-to-back for review |
| `audio/ruleshift-intro-sound.wav` | 6.5 seconds | Intro sound separately, for editing |
| `audio/ruleshift-closing-sound.wav` | 5.5 seconds | Closing sound separately, for editing |
| `previews/` | Still images | Storyboard and visual QA frames |
| `remotion/` | Editable source | React compositions, render scripts and dependency lock |

Video: **1920×1080, 60 fps, H.264, yuv420p, Rec.709**.
MP4 audio: **AAC stereo, 48 kHz, 256 kbps**. Separate WAV stems are stereo PCM.
Black fades at the edges allow simple cuts into and out of the demo footage.

The graphics occupy 12 seconds of the final edit. Target a complete submission
video below three minutes, including these graphics.

## Creative direction

- Deep neon arena, fog, parallax architecture, orbit lines and a camera dolly.
- Three rotating embossed coins cue the gravity-reversal reveal.
- Extruded 5×7 pixel lettering follows the app's original glyph design.
- The pink lightning mark and cyan/pink palette match the application.
- Opening copy: “CHAT WRITES THE RULES. YOU SURVIVE THEM.”
- Closing copy: “LET CHAT CHANGE THE GAME.” and “BUILT WITH CODEX”.
- Original C-minor/add-nine synth atmosphere, sub impacts, three tuned coin
  chimes, gravity sweeps and stereo echoes. No voiceover is included.

Motion is computed from Remotion frame numbers, including the camera, letters,
coins and particles. WebGL renders the 3D scene; a deterministic postprocessing
draw pass adds restrained bloom. Sound events at frames 42, 76 and 112 are
aligned with the three coin cues. No game logic is involved in these graphics.

## Edit and reproduce

Requirements: Node 24+, npm, and Google Chrome/Chromium. The project is isolated
from the application under `submission/video/remotion`; it does not modify the
web application's dependency manifest or require database/Twitch credentials.

From the repository root:

```sh
cd submission/video/remotion
npm ci
npm run typecheck
npm run audio
npm run stills
npm run render
```

`npm run studio` opens the Remotion compositions for editing. The compositions
are `RuleShiftIntro` (390 frames) and `RuleShiftClosing` (330 frames), both 60 fps.
The render script uses the standard Google Chrome path on macOS. Set
`CHROME_PATH` to an authorized Chromium executable on another machine.

To adjust duration, edit the compositions in `src/index.tsx` and the matching
audio durations in `scripts/audio.mjs`. Timeline and geometry are in
`src/motion.tsx`. `npm run render` regenerates the WAV audio, storyboard frames,
and the two final MP4s. The review montage is created separately with FFmpeg:

```sh
ffmpeg -y -i ../ruleshift-intro.mp4 -i ../ruleshift-closing.mp4 \
  -filter_complex '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]' \
  -map '[v]' -map '[a]' -c:v libx264 -crf 18 -preset fast \
  -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart ../ruleshift-motion-preview.mp4
```

## Provenance and verification

These are **brand animations**, not recordings of Twitch delivery or gameplay.
Use actual chat, application and Codex recordings in the middle of the final
submission video. The preview montage alone is not that final submission.

Geometry, layouts and synthesis are authored for RuleShift. The source uses the
application's original lightning logo and pixel glyphs; no stock footage,
third-party music recordings, remote fonts or paid generation APIs were used.
The renderer uses Remotion, React, React Three Fiber and Three.js; their package
licenses apply. This document does not assign a source-code license for the
owner's project.

`render-info.json` records composition dimensions and frame counts.
`audio/audio-info.json` records synthesized audio levels.
`verification.json` records the actual media validation. Source preview frames
and extracted final-video frames are under `previews/` for inspection.
