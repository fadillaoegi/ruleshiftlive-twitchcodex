# RuleShift Live — English voice-over script

Version: real Twitch demonstration.

This is a spoken narration script, not subtitles. No narration is burned into the video.
Read in a calm, conversational tone. Pause at cuts and let the four-second effect be visible.

Total edit duration: 02:38.5. Intro/closing contain original sound design.

## 00:00.0–00:06.5 — intro

[No voice-over. Let the original sound design play.]

## 00:06.5–00:14.5 — STREAMED ON TWITCH

This is RuleShift Live on my Twitch channel, streamed from a browser. Now, the connected game in close-up.

## 00:14.5–00:28.0 — CHAT BECOMES GAMEPLAY

On Twitch, chat usually reacts to the game. RuleShift Live lets chat change it. Viewers propose a rule, the streamer approves it, and the rule changes actual game physics.

## 00:28.0–00:40.0 — A REAL TWITCH PROPOSAL

This real Twitch message became a proposal: every third coin reverses gravity for four seconds. The streamer has already approved it, and the viewer keeps the credit.

## 00:40.0–00:59.0 — THE STREAMER DECIDES

Chat cannot activate a rule by itself. This proposal was approved before recording. I review its exact trigger and effect, then start the round. One approved rule controls this arena.

## 00:59.0–01:13.0 — THIRD COIN. REAL GRAVITY.

On the third coin, acceleration reverses and the player rises toward the ceiling. Four seconds later, gravity returns automatically. Movement and collisions follow the rule.

## 01:13.0–01:24.0 — SURVIVE THE SHIFT

I keep playing with the same keyboard controls. Another third-coin trigger refreshes the effect, while the arena and its solid platforms stay playable.

## 01:24.0–01:34.0 — THE ROUND ENDS AUTOMATICALLY

At the end of the seventy-five-second round, the server closes the result. Effects clear, movement stops, and the final score is delivered.

## 01:34.0–01:46.0 — SAVED AND TRACEABLE

The result is confirmed in PostgreSQL. I can download a round record with the rule, its author, the originating message, and observed gameplay events.

## 01:46.0–01:59.0 — ONLY SUPPORTED RULES CAN RUN

Unsupported requests cannot be approved. Chat is never executed as code. Supported proposals pass through a bounded queue, and the streamer keeps control over every activation.

## 01:59.0–02:21.0 — BUILT AND VERIFIED WITH CODEX

I used Codex to build the Go application boundaries, Twitch integration, and TypeScript game engine. Here, Codex reviews the real rule and expiry logic and runs the checks. Tests cover race safety, PostgreSQL persistence, transport failures, and the game behavior.

## 02:21.0–02:33.0 — ACTUAL PROJECT SOURCE

The implementation keeps domain rules independent from Twitch and storage. RuleShift Live turns audience suggestions into reversible gameplay changes, with streamer approval and an automatic return to normal gravity.

## 02:33.0–02:38.5 — closing

[No voice-over. Let the original sound design play.]

## Recording notes

Keep the voice-over on its own editing track. Keep gameplay and Codex footage audible only if intentionally mixed; the captured screen clips contain no microphone audio. The clip source labels are evidence labels, not subtitles.
