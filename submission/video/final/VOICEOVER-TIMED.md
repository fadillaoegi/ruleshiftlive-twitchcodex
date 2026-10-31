# Final demo — timed English narration

Uses the eleven original audio clips supplied by the user. Subtitle spelling and punctuation follow this script; timing follows local word-level transcription.

## 00:00:00.000–00:00:06.500 — intro

No narration. Original music and motion explain this section.

## 00:00:06.500–00:00:14.500 — STREAMED ON TWITCH

Audio: `../voiceover/ruleshiftlive-vo-1.mp3`, begins 0.65 seconds into the chapter.

This is RuleShift Live on my Twitch channel, streamed from a browser. Now, the connected game in close-up.

## 00:00:14.500–00:00:27.500 — CHAT BECOMES GAMEPLAY

Audio: `../voiceover/ruleshiftlive-vo-2.mp3`, begins 0.65 seconds into the chapter.

On Twitch, chat usually reacts to the game. RuleShift Live lets chat change it. Viewers propose a rule, the streamer approves it, and the rule changes actual game physics.

## 00:00:27.500–00:00:34.500 — HOW ONE RULE CHANGES THE GAME

No narration. Original music and motion explain this section.

## 00:00:34.500–00:00:46.500 — A REAL TWITCH PROPOSAL

Audio: `../voiceover/ruleshiftlive-vo-3.mp3`, begins 0.65 seconds into the chapter.

This real Twitch message became a proposal: every third coin reverses gravity for four seconds. The streamer has already approved it, and the viewer keeps the credit.

## 00:00:46.500–00:01:01.500 — THE STREAMER DECIDES

Audio: `../voiceover/ruleshiftlive-vo-4.mp3`, begins 0.65 seconds into the chapter.

Chat cannot activate a rule by itself. This proposal was approved before recording. I review its exact trigger and effect, then start the round. One approved rule controls this arena.

## 00:01:01.500–00:01:15.500 — THIRD COIN. REAL GRAVITY.

Audio: `../voiceover/ruleshiftlive-vo-5.mp3`, begins 0.65 seconds into the chapter.

On the third coin, acceleration reverses and the player rises toward the ceiling. Four seconds later, gravity returns automatically. Movement and collisions follow the rule.

## 00:01:15.500–00:01:26.500 — SURVIVE THE SHIFT

Audio: `../voiceover/ruleshiftlive-vo-6.mp3`, begins 0.65 seconds into the chapter.

I keep playing with the same keyboard controls. Another third-coin trigger refreshes the effect, while the arena and its solid platforms stay playable.

## 00:01:26.500–00:01:36.500 — THE ROUND ENDS AUTOMATICALLY

Audio: `../voiceover/ruleshiftlive-vo-7.mp3`, begins 0.65 seconds into the chapter.

At the end of the seventy-five-second round, the server closes the result. Effects clear, movement stops, and the final score is delivered.

## 00:01:36.500–00:01:48.500 — SAVED AND TRACEABLE

Audio: `../voiceover/ruleshiftlive-vo-8.mp3`, begins 0.65 seconds into the chapter.

The result is confirmed in PostgreSQL. I can download a round record with the rule, its author, the originating message, and observed gameplay events.

## 00:01:48.500–00:02:01.500 — ONLY SUPPORTED RULES CAN RUN

Audio: `../voiceover/ruleshiftlive-vo-9.mp3`, begins 0.65 seconds into the chapter.

Unsupported requests cannot be approved. Chat is never executed as code. Supported proposals pass through a bounded queue, and the streamer keeps control over every activation.

## 00:02:01.500–00:02:21.500 — BUILT AND VERIFIED WITH CODEX

Audio: `../voiceover/ruleshiftlive-vo-10.mp3`, begins 0.65 seconds into the chapter.

I used Codex to build the Go application boundaries, Twitch integration, and TypeScript game engine. Here, Codex reviews the real rule and expiry logic and runs the checks. Tests cover race safety, PostgreSQL persistence, transport failures, and the game behavior.

## 00:02:21.500–00:02:36.500 — ACTUAL PROJECT SOURCE

Audio: `../voiceover/ruleshiftlive-vo-11.mp3`, begins 0.65 seconds into the chapter.

The implementation keeps domain rules independent from Twitch and storage. RuleShift Live turns audience suggestions into reversible gameplay changes, with streamer approval and an automatic return to normal gravity.

## 00:02:36.500–00:02:42.000 — closing

No narration. Original music and motion explain this section.

