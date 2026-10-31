# RuleShift Live — English voice-over script

Version: review cut with clearly labelled archival evidence and rehearsal.

This is a spoken narration script, not subtitles. No narration is burned into the video.
Read in a calm, conversational tone. Pause at cuts and let the four-second effect be visible.

Total edit duration: 02:09.5. Intro/closing contain original sound design.

## 00:00.0–00:06.5 — intro

[No voice-over. Let the original sound design play.]

## 00:06.5–00:20.0 — CHAT BECOMES GAMEPLAY

On Twitch, chat usually reacts to the game. RuleShift Live lets chat change it. Viewers propose a rule, the streamer approves it, and the rule changes actual game physics.

## 00:20.0–00:39.0 — REAL TWITCH TEST · EARLIER CAPTURE

In our earlier real Twitch test, this chat message became a pending proposal. After approval, the game was playable and the completed round saved forty-five coins in PostgreSQL. These images document that earlier test.

## 00:39.0–00:53.0 — A CLEARLY LABELLED WALKTHROUGH

For this recorded walkthrough, I am using the separate rehearsal mode. It runs the real application and physics engine, while keeping local testing distinct from Twitch and database evidence.

## 00:53.0–01:03.0 — FOUR SECONDS, THEN NORMAL GRAVITY

On the third coin, the player rises. The four-second effect expires automatically, and normal gravity returns without another button press.

## 01:03.0–01:11.0 — IMMEDIATE STREAMER CONTROL

The third coin reverses gravity. Stop immediately restores normal gravity and ends the round.

## 01:11.0–01:17.0 — SOURCE SEPARATION

The rehearsal result is explicitly browser-only. It never claims live database storage.

## 01:17.0–01:30.0 — ONLY SUPPORTED RULES CAN RUN

Unsupported requests cannot be approved. Chat is never executed as code. Supported proposals pass through a bounded queue, and the streamer keeps control over every activation.

## 01:30.0–01:52.0 — BUILT AND VERIFIED WITH CODEX

I used Codex to build the Go application boundaries, Twitch integration, and TypeScript game engine. Here, Codex reviews the real rule and expiry logic and runs the checks. Tests cover race safety, PostgreSQL persistence, transport failures, and the game behavior.

## 01:52.0–02:04.0 — ACTUAL PROJECT SOURCE

The implementation keeps domain rules independent from Twitch and storage. RuleShift Live turns audience suggestions into reversible gameplay changes, with streamer approval and an automatic return to normal gravity.

## 02:04.0–02:09.5 — closing

[No voice-over. Let the original sound design play.]

## Recording notes

Keep the voice-over on its own editing track. Keep gameplay and Codex footage audible only if intentionally mixed; the captured screen clips contain no microphone audio. The clip source labels are evidence labels, not subtitles.
