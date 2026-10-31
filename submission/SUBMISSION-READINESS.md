# Submission readiness — updated October 31, 2026

**Latest video update — November 1:** [`video/final/ruleshift-demo-final.mp4`](video/final/ruleshift-demo-final.mp4) is the complete **02:42** Remotion film with eleven supplied voice clips, 41 English subtitle cues, original backsound and an informative 3D rule diagram. Final decode, timing, audio and encoded visual checks passed. Earlier `video/demo/` versions remain separate. Entry publication and non-video requirements below are still separate.

Verdict: the core application is ready to demonstrate. The final entry is not
yet verified as ready to submit. This is a source-backed readiness assessment;
entrant eligibility and acceptance remain subject to the organizer's rules.

## Sources checked

- [Official Rules](https://twitchcon-codex.devpost.com/rules)
- [Submission overview](https://twitchcon-codex.devpost.com/)
- [Organizer FAQ](https://twitchcon-codex.devpost.com/resources)
- [Schedule](https://twitchcon-codex.devpost.com/details/dates)

## Requirements and current evidence

| Item | Assessment | Evidence or remaining action |
| --- | --- | --- |
| Twitch interaction built with Codex | Demonstrated | Real OAuth/EventSub, controlled chat intake, approval and a playable round; see CODEX-EVIDENCE.md and docs/evidence/twitch-*.json. |
| Intended-platform functionality | Locally demonstrated | Go/Vite startup, PostgreSQL integration, web tests/build and Chrome rehearsal passed. The user played a real-source round; 45 coins and finished storage matched direct SQL. Independent installation remains unverified. |
| New work during the entry period | Consistent with local records | Development evidence begins October 29, within the October 23–November 2 period. The entrant must confirm originality and provenance. |
| Repository access for judges | Unverified | No submission repository URL or judge-access confirmation was found in project materials. Supply complete source/assets/setup instructions and keep access free during judging. Repository publication/settings belong to the user. |
| Project description | Pending | README and development evidence exist, but no final Devpost description was found. Explain the experience and how Codex contributed; match actual behavior. |
| Codex session identifier | Needs selection check | codex-session.json records the initial implementation thread. The current continuation thread differs. Confirm the recorded identifier corresponds to the thread containing most of the build before entering it. |
| YouTube demonstration | Actual Twitch capture and final edit prepared; publication pending | `video/demo/` contains the updated 158.5-second Remotion edit and timed English voice-over text, including eight seconds of actual public Twitch broadcast. The new real-source round has matching video/controller/PostgreSQL evidence; approval occurred before filming and is described accurately. The earlier 129.5-second archival review remains separate. No YouTube URL is verified. The FAQ permits public or unlisted viewing; private video is unsuitable. |
| English submission materials | Partially ready | UI/docs and the timed spoken-narration script are English. No subtitles were requested or embedded. Final description and judge instructions remain to be completed. |
| Participant eligibility | Unverified | Confirm age, legal residence, individual/team entry, conflicts and any team representative. No identity documents were requested or inspected. |
| Ownership and third-party permissions | Partially assessed | Visual asset provenance is documented. Verify dependency terms, all submitted material permissions and ownership. Avoid unrelated streamer footage/music in the demo. No particular open-source license is mandated by this audit. |
| Devpost registration/final submission | Unverified | Confirm joined status, fill required fields, and verify the project displays Submitted. A draft alone is insufficient. |

The current source-backed interpretation is that runtime AI inference, an OBS
overlay, multiplayer and a hosted web deployment are not prescribed technical
features. A working Twitch-connected experience built with Codex is the core
technical condition. Judge access through the required repository still matters.

## Project verification still open

The new real-source round `56229fde4cf8185ab948448b147755bb` links a real Twitch
message to a saved 75-second result with 12 coins and four shifts. Browser
recording and its downloaded event trace show first expiry after 4,002 ms;
backend state and a direct read-only PostgreSQL query match the saved result.
See `../docs/evidence/twitch-browser-capture.json`. The proposal was already
approved before this capture; narration does not pretend to show the click.
This closes the core real chat/approval/physics/expiry evidence gate for the
new round. The earlier 45-coin screenshot's event trace remains uninspected.
Live Stop/failure-retry and OBS/720p checks remain separate and unverified.

Round-record review, OBS capture and 720p readability are our validation tasks;
the organizer does not prescribe this specific JSON export or OBS software.
The existing Twitch chat test occurred while the channel was offline. Record a
clear actual-Twitch demonstration; an on-stream recording strengthens the demo,
but the published rules do not separately prescribe a livestream session.

## Deadline and judging

The Official Rules specify November 2, 2026 at 14:00 Pacific. The schedule labels
this PST. Calculated with America/Los_Angeles and Asia/Jakarta, this is
**November 3, 2026 at 05:00 WIB**. The project's earlier **November 2 at 21:00 WIB**
remains an internal target, not the official cutoff.

The FAQ's UTC conversion conflicts with that PST time; the schedule's judging
dates also differ from the Official Rules. Use the Official Rules and seek
organizer clarification for any unresolved discrepancy. Conservatively retain
judge access through the November 15 judging end in those rules. Preserve the
submitted repo/video/materials after the deadline, following the FAQ's guidance.

The four equally weighted judging areas are innovation, community impact,
technical implementation/Codex use, and design. Local functionality establishes
evidence, not a prediction of acceptance or a winning score. Community impact
has not been measured.

## Remaining order of work

1. Review the final demo and record/mix its separate English voice-over if desired.
2. Prepare the English Devpost description using the verified behavior.
3. Upload the actual Twitch/Codex demonstration to YouTube and verify viewing access.
4. Supply the repository URL, confirm judge access and reproducible setup, and
   review the user-managed export for credentials and third-party material.
5. Confirm the principal Codex session, entrant eligibility and ownership, then
   complete Devpost and verify Submitted before the deadline.

No paid AI calls, new gameplay scope, Git operations or external publication were
performed for this audit. Existing tests were not repeated for documentation work.

## Branding graphics prepared after this audit

`video/` now contains a rendered Remotion intro, closing and review montage,
with original sound, editable source and media verification. They contribute
12 seconds to the final edit. `video/demo/` adds an application/Codex review
edit and timed English narration text. Current rehearsal, earlier actual Twitch
screenshots and native Codex footage are explicitly separated. The original
bounded wait ended without a proposal; a subsequent user message and restored
connection supplied the new real-source round described above. The full
150.5-second edit replaces the archival gameplay section with the recorded
proposal, start, physics, automatic end and stored result. A YouTube viewing
link and final Devpost materials are still outstanding.

Final demo media QA passed: 150.5 seconds, exactly 9,030 frames, H.264
1920×1080/60 fps, 48 kHz stereo AAC, no subtitle stream, -2.3 dBFS audio peak
and a full decode. Encoded-frame samples were inspected. See
`video/demo/verification.json`. The matching English voice-over remains a
separate spoken-narration script; the MP4 has not been uploaded to YouTube.

## October 31 — additional on-stream capture preparation

`video/stream-setup/` contains an 18-second labelled layout preview and OBS
scene import, with an actual controller and the supplied Twitch viewer reference
cropped for privacy. OFFLINE status is preserved and a real Helix status check
also found the channel offline. Actual OBS import/account setup is unverified;
no public broadcast was started. Native Twitch player/chat footage and a new
on-camera approval remain planned after the entrant chooses to broadcast.
The existing 150.5-second demo is unchanged. This preview is not additional
live-use evidence or submission approval.

## October 31 — broadcast excerpt added to the demo

The user requested a short proof of public broadcasting rather than another
interactive setup sequence. Eight seconds of actual October 31 Twitch viewer
recording are included at 00:06.5–00:14.5, with the source labelled earlier in
this session. The clip shows the idle app in a real Restream broadcast; Helix
and separate visual inspection confirmed public streaming. No LIVE badge,
player or chat arrival was generated. Unrelated recommendations were cropped.

The subsequent close-ups retain the verified real-source round with 12 coins,
four shifts and matching controller/PostgreSQL evidence. They are separate from
the public broadcast recording. A new October 31 capture attempt did not reach
a round because its browser locator timed out; it remains private and is not
substituted for completed evidence. The previous verified capture was restored.

The updated target is 158.5 seconds (under three minutes), with matching English
spoken-narration text, original Remotion branding and genuine Codex footage.
See `video/demo/RULES-VIDEO-COVERAGE.md` and the final `verification.json`.
YouTube publication and other entry requirements above are still separate;
this edit is not a full compliance or eligibility certification.
