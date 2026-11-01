# RuleShift Live — final narrated demo

**Use `ruleshift-demo-final.mp4` for the latest complete edit.**

Duration: **162 seconds (02:42)**. H.264 1920×1080/60 fps with the user’s eleven original English voice recordings, original neon/sci-fi music and burned-in English subtitles. Remotion authors the original 3D animation, new rule explainer, chapter layouts and subtitle graphics. Native FFmpeg compositing preserves normal-speed actual footage.

## Files

| File | Purpose |
| --- | --- |
| `ruleshift-demo-final.mp4` | Finished narrated movie with music and visible subtitles |
| `subtitles-en.srt` / `.vtt` | Separate English subtitle files for upload/editing |
| `VOICEOVER-TIMED.md` | Narration and its chapter/audio timing |
| `audio/ruleshift-neon-bed.wav` | Original 96 BPM C-minor neon soundtrack |
| `audio/voiceover-track.wav` | Narration placed on the movie timeline, without music |
| `audio/final-mix.wav` | Final stereo narration/music/branding mix |
| `edit-plan.json` | Exact source/chapter timing and evidence labels |
| `verification.json` | Final encoded-media checks and content hash |
| `previews/encoded/` | Sample frames extracted from the final MP4 |

## Story and timing

| Timeline | Material |
| --- | --- |
| 00:00.0–00:06.5 | Intro |
| 00:06.5–00:14.5 | STREAMED ON TWITCH |
| 00:14.5–00:27.5 | CHAT BECOMES GAMEPLAY |
| 00:27.5–00:34.5 | HOW ONE RULE CHANGES THE GAME |
| 00:34.5–00:46.5 | A REAL TWITCH PROPOSAL |
| 00:46.5–01:01.5 | THE STREAMER DECIDES |
| 01:01.5–01:15.5 | THIRD COIN. REAL GRAVITY. |
| 01:15.5–01:26.5 | SURVIVE THE SHIFT |
| 01:26.5–01:36.5 | THE ROUND ENDS AUTOMATICALLY |
| 01:36.5–01:48.5 | SAVED AND TRACEABLE |
| 01:48.5–02:01.5 | ONLY SUPPORTED RULES CAN RUN |
| 02:01.5–02:21.5 | BUILT AND VERIFIED WITH CODEX |
| 02:21.5–02:36.5 | ACTUAL PROJECT SOURCE |
| 02:36.5–02:42.0 | Closing |

The new seven-second 3D illustration explains three coins triggering a four-second gravity reversal, followed by automatic restoration. Its illustrated countdown lasts four seconds; it is labelled as a diagram, not gameplay evidence. Side panels and a CHAT → REVIEW → PLAY → SAVE guide explain the real footage. Captions occupy their own lower area and do not cover controls.

The music is an original deterministic composition with pads, arpeggios, bass, restrained percussion and coin/gravity accents. Narration is normalized and controls a sidechain compressor so music becomes quieter during speech. The master targets -16 LUFS; final measurements are in `verification.json`. No stock song, paid music service or generated voice is used.

## Footage provenance

The eight-second public Twitch excerpt is a real October 31 browser-streaming recording. It shows the app idle. Gameplay close-ups are a separate verified real Twitch-source round with 12 coins, four shifts and matching controller/PostgreSQL evidence. The proposal was approved before filming; the edit does not invent an approval click. Unsupported input is explicitly local rehearsal. Codex footage is an actual cropped development/check recording. See `../captures/twitch-broadcast-proof.json`, `../captures/live-capture.json` and `../../../docs/evidence/twitch-browser-capture.json`.

The eleven voice inputs remain unchanged under `../voiceover/`. Local whisper.cpp word timings were aligned to the supplied narration script, retaining its spelling and punctuation. `subtitle-alignment.json` records audio hashes and alignment ratios; `word-timings.json` preserves reusable timings. Audio was not uploaded to a transcription service. There were no paid API calls.

## Rebuild with Remotion

From `submission/video/remotion`:

```sh
npm run prepare:final
npm run audio:final
npm run subtitles:final
npm run typecheck
npm run render:final:graphics
npm run render:final
npm run verify:final
```

`npm run studio:final` opens the final compositions in Remotion Studio. The checked-in word timings allow subtitle regeneration without downloading a model. If narration changes, regenerate those timings from the new audio first. The renderer normalizes every chapter to the same MP4 timebase and checks picture length/frame rate before the final subtitle/audio pass.

## Video requirement mapping

The [official rules](https://twitchcon-codex.devpost.com/rules) request a video shorter than three minutes, footage of the project on Twitch, and footage of development with Codex. This 02:42 edit includes the actual public Twitch excerpt, the working Twitch-source game and real Codex recording. English narration and subtitles are included. This is not a guarantee of acceptance or a claim that all entry requirements are complete. Repository/judge access, eligibility, final description and the principal Codex session ID remain separate entry tasks. Nothing was uploaded or submitted by this media work.

The user subsequently supplied https://youtu.be/AvWHm6U2jUs. Official unauthenticated YouTube oEmbed returns the title `RuleShift Live | Twitch Chat Changes the Game | Codex x TwitchCon` and channel `FLdev`; saved metadata is in `../../design/source/youtube-oembed.json`. Complete playback and correspondence to this local final MP4 have not been verified. Upload-ready thumbnails and the supporting project brief are in `../../design/` and `../../documents/`.
