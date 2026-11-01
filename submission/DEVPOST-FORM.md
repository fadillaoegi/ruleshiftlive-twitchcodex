# RuleShift Live - Devpost submission copy

Prepared November 1, 2026. Copy for entrant review, not a submitted entry.
Additional authenticated-form fields and participant declarations must be
completed using the entrant's actual circumstances.

Submission page: https://devpost.com/submit-to/31742-codex-x-twitchcon-hackathon/manage/submissions

## Project name

RuleShift Live

## Tagline

Chat writes the rules. You survive them. A Twitch game where viewer proposals become streamer-approved changes to gravity.

## Project story - copy these sections

### Inspiration

The best moments on Twitch happen when viewers help create what happens next.
RuleShift Live gives chat a creative role while keeping the streamer in control:
viewers propose a twist, the streamer decides, and the game shows the consequence.

### What it does

RuleShift Live is a neon pixel-art browser game connected to real Twitch chat.
A viewer sends `!rule Every third coin flips gravity for 4 seconds`. The proposal
enters a bounded queue with its author attached. The streamer can inspect,
approve or veto it before starting a 75-second round.

Every third coin reverses actual acceleration, sending the player toward the
ceiling. Four seconds later, gravity returns automatically. Repeated triggers
refresh the timer. Completed results are saved in PostgreSQL with rule attribution.

The current constrained parser supports triggers from 2 to 10 coins and durations
from 1 to 6 whole seconds. Unsupported proposals cannot be approved. Chat is
never executed as code; runtime AI inference is not required.

### How it was built

React, TypeScript, Vite and Tailwind provide the controller interface; Canvas 2D
handles movement, collisions and gravity. Go manages validated proposals and
round transitions. Twitch OAuth and EventSub WebSocket deliver real chat
messages, while PostgreSQL 18 stores proposals and results.

Codex assisted with architecture, implementation, Twitch integration, game
behavior, startup tooling, tests and debugging. Domain logic stays separate
from HTTP, Twitch and persistence adapters. The demo includes actual Codex
development footage and verification commands.

### Challenges

Making chat-driven changes predictable required explicit approval, a bounded
queue, deduplication and viewer cooldowns. Timer refresh and automatic expiry
prevent effects from stacking or persisting after a round. Source labels keep
local rehearsal separate from real Twitch activity.

### Accomplishments

A verified real Twitch-source round completed with 12 coins and four gravity
shifts. The controller trace recorded the first effect expiring after 4,002 ms;
the saved result matched backend state and a read-only PostgreSQL check.
Recorded Go race tests, static checks, web tests and the production build passed.

The video also contains a separate actual public Twitch broadcast excerpt
showing the app idle. Gameplay close-ups come from the verified Twitch-source
round; approval occurred before that recording. Scores and effect timestamps
remain controller-reported observations.

### What was learned

A small, understandable rule can create a visible audience-driven moment.
Streamer control, clear feedback and reliable restoration matter as much as
the rule itself. Separating domain logic from integrations made verification
and iteration easier.

### What's next

Explore more bounded rule types, clearer viewer onboarding and streamer
playtests to evaluate entertainment value and usability. The current milestone
supports one local streamer, one backend process and one arena. Engagement
improvements have not yet been measured.

## Built with

OpenAI Codex, Twitch API, EventSub, Go, React, TypeScript, PostgreSQL, Canvas,
Vite, Tailwind CSS. Select available matching tags.

## Video demo URL

https://youtu.be/AvWHm6U2jUs

The local final edit is 02:42. Official unauthenticated YouTube oEmbed returned
the expected title and FLdev channel. Full playback and correspondence to the
local final edit still require entrant review.

## Repository URL

https://github.com/fadillaoegi/ruleshiftlive-twitchcodex

The user supplied this URL. Unauthenticated GitHub API retrieval confirms a
public repository and accessible README. Independent installation and complete
remote source/asset availability have not been audited. Use this URL in the
repository field and in the optional "Try it out" code link.

## Codex Session ID - confirm principal build thread

Recorded implementation session: `01a18796-7169-7d23-a967-e2dd8079a7fb`.
Source: `codex-session.json`. Confirm this is the thread containing most of the
build; verify with `/status` in that thread before entering it.

## Upload mapping

- Project gallery thumbnail: `design/devpost-cover.jpg`.
- Optional gallery poster: `design/poster-a3.jpg`.
- Supporting PDF if a file field is offered:
  `documents/ruleshift-live-project-brief.pdf`.

No public hosted application URL has been verified. Judge setup is documented
in the README and project brief; localhost is not a public application link.

## Final entrant actions

Review complete unauthenticated video playback; supply repository/judge access;
confirm principal session and participant/team declarations; save the required
form fields, use the final submit action and verify Devpost's displayed status.
Preparing this copy did not perform those actions.

Sources checked November 1, 2026:
https://twitchcon-codex.devpost.com/ and https://twitchcon-codex.devpost.com/rules.
