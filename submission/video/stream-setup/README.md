# RuleShift Live — broadcast setup preview

This package prepares the next actual livestream capture. It is **not evidence
that a broadcast has started**. The supplied Twitch screenshot is offline, and
the real Helix Get Streams check saved in `twitch-status.json` also returned
offline. No LIVE badge, viewer count or Twitch player content was invented.

## Files

| File | Purpose |
| --- | --- |
| `stream-layout-preview.mp4` | 18-second labelled layout preview: original 3D opening, actual idle controller screenshot, and the supplied offline Twitch viewer reference |
| `scene-preview.png` | Review the intended Arena layout before using OBS |
| `viewer-before-preview.png` | Review the Twitch viewer reference; original OFFLINE status is retained |
| `RuleShift-Live-OBS.json` | Importable scene collection for this Mac; import/real capture must still be checked in OBS |
| `stream-frame.png` | Original Remotion-rendered frame for the Arena scene |
| `opening-overlay.png` | Transparent Starting Soon label for the original 3D opening |
| `controller-preview.json`, `twitch-status.json` | Actual preparation/status observations, without credentials |
| `setup-info.json`, `verification.json` | Setup provenance and media/export QA |

The collection contains **01 — RuleShift Starting Soon** and
**02 — RuleShift Arena**. Starting Soon loops the original 3D graphic. Arena
captures the dedicated **actual controller window**, using macOS Screen Capture.
It does not start a second simulated game in an OBS Browser Source. No
microphone, stream credentials or account settings are included. Sources are
muted by default; narration can be recorded separately.

The offline reference is cropped from the user's supplied screenshot to remove
browser tabs/bookmarks and unrelated recommended channels. It is a still
reference, not a reconstructed Twitch page or a new live observation.

## Open the prepared scene

1. Keep the dedicated RuleShift controller window open. The backend and web app
   must be running on localhost:8080 and localhost:5174.
2. In OBS, choose **Scene Collection → Import**, select
   `RuleShift-Live-OBS.json`, and import it. Select **RuleShift Live — Broadcast
   Setup** from the Scene Collection menu.
3. Select **02 — RuleShift Arena**. In the source **RuleShift Actual Controller**,
   open Properties and confirm **Window Capture** targets the dedicated
   **RuleShift Live — Chat writes the rules.** window. The saved window ID is
   specific to this current session; reselect it after restarting Chrome.
4. Check that the same game/controller you operate appears in the OBS preview.
   If the capture is blank, grant OBS Screen Recording permission in macOS and
   reselect the window. Adjust the title-bar crop if this Mac's scaling differs.
5. In OBS **Settings → Stream**, select **Twitch** and connect the broadcaster
   account through OBS. Account login/stream settings are not part of the media.
6. In RuleShift, use **Reconnect @fldevboo** and confirm Twitch is connected
   before sending a new rule. This prevents another message being sent during
   a disconnected gap; missed chat is not replayed.

OBS was opened for preparation. Its existing collection/profile was not
overwritten. WebSocket control was disabled and macOS Accessibility access was
not granted, so the import/account setup above remains a user action. The
generated export has not been validated by an actual OBS import or recording.

## Start the real capture only after reviewing the preview

Starting Streaming publishes to the user's channel. The user must choose to
start that public broadcast. Once ready, use **Start Streaming** in OBS, select
Starting Soon briefly, and then switch to Arena. Open
`https://www.twitch.tv/fldevboo` with its chat visible and confirm the actual
player is receiving the game. A positive API status alone is insufficient to
prove the game is visible in the player.

Tell the recording operator that the channel is LIVE **before sending the new
rule or clicking Approve**. Then record the actual chain:

1. Twitch viewer page with the real broadcast playing and chat visible.
2. A consenting viewer or the broadcaster sends the controlled rule:
   `!rule Every third coin flips gravity for 4 seconds`.
3. The pending proposal appears in the actual controller. Review it, click
   Approve on camera, and Start the round in that same controller window.
4. Collect three coins, show reversed gravity and automatic restoration, then
   show that change arriving in the native Twitch player.
5. Let the 75-second round finish, confirm PostgreSQL storage and download the
   real controller record. Keep viewer and controller recordings separate and
   attributable to the same round. Streaming delay is normal; do not fabricate
   frame-perfect synchronization between the viewer and controller.

See `LIVE-CAPTURE-PLAN.md` for the proposed replacement edit and narration.
The primary demo in `../demo/` is now a 158.5-second edit with an eight-second
actual October 31 Twitch broadcast excerpt plus separate verified gameplay.
This setup preview remains distinct from that actual broadcast footage and
does not replace the reviewed demo.

## Reproduce the preview

The dedicated controller is an actual Chrome app window with a private project
profile and a loopback-only debugging endpoint. Its preparation does not approve
a proposal, start a round, send chat, or start broadcasting. Close that dedicated
window normally after filming.

```sh
cd submission/video/remotion
npm run prepare:stream-controller
npm run check:broadcast
npm run typecheck
npm run render:stream-setup
```

The scene export uses the window ID saved in
`.local/stream-controller/window.json`; regenerate/reselect that ID if the
window changes. `src/stream-preview.tsx` and `src/stream-index.tsx` contain the
editable Remotion layouts. The renderer uses Remotion for the layouts and
FFmpeg for native video assembly. The preview has no microphone/audio track.

Public status uses Twitch's documented
[Get Streams endpoint](https://dev.twitch.tv/docs/api/reference/#get-streams)
and an app access token obtained through the
[client-credentials flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow).
Credentials and tokens remain in process memory; the status file contains only
bounded public broadcast metadata. The script never starts/stops a stream or
sends a chat message.
