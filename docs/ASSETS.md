# Visual assets

All application imagery in this implementation is original, code-generated work:

- `web/src/PixelText.tsx`: hand-authored 5×7 uppercase bitmap title glyphs.
- `web/src/game/render.ts`: hand-authored robot, coin, skyline and platforms.
- `web/src/cyberpunk.css`: neon cyan/magenta panels and pixel presentation.
- `web/public/favicon.svg`: shared pink lightning mark for the browser favicon
  and application header, using the existing logo symbol and colors.

There are no downloaded stock images, remote fonts, third-party sprite sheets or
AI-generated image assets. System monospace fonts render ordinary interface copy.
Dependency license files are supplied with their packages. Choose the repository
source license before public submission; this implementation does not invent a
license grant on behalf of the project owner.

## Submission motion graphics

`submission/video/` contains original Remotion 3D branding clips and procedural
stereo sound. The geometry and layouts are code-authored, use the app's logo
and pixel glyphs, and contain no stock footage or recorded third-party music.
The separate Remotion project's dependencies and their licenses are listed in
its own package files. These clips are brand graphics, not game/live evidence.

## Application demonstration media

`submission/video/demo/` combines those graphics with original application
screen captures, an actual cropped Codex session recording and the user's
earlier screenshots of their controlled Twitch test. Those screenshots contain
the entrant's own controlled rule message, not unrelated streamer footage or a
private chat transcript. Archival screenshots and current local rehearsal are
explicitly labelled. The primary demo now replaces archival gameplay with a
new real Twitch-source recording, attributed message, observed effect expiry
and confirmed stored result. The proposal was approved before filming; the
edit does not invent a click or the original chat-send action.

Remotion renders the editorial layouts; FFmpeg composites the original screen
clips at normal speed. Original brand sound is retained, with no microphone,
third-party music, paid TTS or generated voice performance. Timed English
voice-over text is supplied as a separate script. Capture provenance, editable
sources and verification are documented in `submission/video/demo/README.md`.

`submission/video/stream-setup/` adds original Remotion broadcast frames and
Starting Soon labels, an actual idle controller screenshot and a cropped
user-supplied Twitch viewer reference. The reference retains its original
OFFLINE state; browser/private areas and unrelated channels are removed.
The setup preview is labelled not broadcast. No Twitch LIVE badge, player,
viewer count or message was synthesized. The OBS import references the same
actual controller window; actual import/streaming remain unverified. No
microphone or account stream settings are included.

The final demo also includes `submission/video/captures/twitch-broadcast-proof.mp4`: eight seconds of actual public Twitch viewer recording from the user's October 31 Restream broadcast. Its provenance is in the adjacent JSON. Recommendations and the signup footer are cropped out; no replacement Twitch UI, LIVE badge or chat was generated. The app is idle in this broadcast excerpt; gameplay close-ups come from the separate verified real-source round. The user's broadcaster camera is part of the actual stream, not a generated person. No microphone audio or third-party music from that stream is used.

The November 1 narrated final package is under `submission/video/final/`. Its
eleven original voice inputs are user-supplied MP3s in `video/voiceover/`; no
new generated voice is attributed to this work. Its additional music is an
original deterministic 96 BPM C-minor composition with stereo pads, arpeggios,
bass, restrained drums and coin/gravity accents. The new 3D coins, arena/cube
and countdown diagram are code-authored in Remotion/Three.js and labelled
as illustration. Captions and explanatory panels are Remotion graphics.
Subtitle timing uses local whisper.cpp base.en inference; the delivered public
word-timing data describes only the supplied narration. Audio was not uploaded
to a transcription service. Existing brand music and actual-footage provenance
remain as documented above.
