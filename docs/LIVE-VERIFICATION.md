# Live verification runbook — pending

The first milestone is not complete until this runbook is executed with real
Twitch chat. The synthetic fixture under the adapter tests is not a substitute.

## Prepare the local machine

Use a session permitted to listen on localhost and reach Twitch. Check ports
8080, 5174 and the published host port of the user's existing PostgreSQL 18
container. Follow [the PostgreSQL 18 guide](POSTGRES-18.md), set the two database
URLs in `backend/.env`, and run `node scripts/doctor.mjs`. Start the application
using `node scripts/dev.mjs --live` once the Twitch configuration below is set.
Verify `/healthz` reports PostgreSQL, and Signal check shows backend
reachable and PostgreSQL connected. Run the real opt-in database integration
test against a separate `_test` database before connecting Twitch.

Create a Twitch Developer application with a verified email and 2FA, following
the [official registration instructions](https://dev.twitch.tv/docs/authentication/register-app/).
Register **exactly** `http://localhost:8080/auth/twitch/callback` as the redirect.
Set its client ID and client secret in the ignored backend `.env`, and restart
the backend with those values loaded. Do not place secrets in `VITE_` variables.

Open `http://localhost:5174`, select Twitch live, and connect the broadcaster
account for the channel you own. This milestone uses the signed-in broadcaster
as both `broadcaster_user_id` and `user_id`. It follows Twitch's
[single-channel chat authentication](https://dev.twitch.tv/docs/chat/authenticating/),
[authorization-code flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)
and [channel.chat.message subscription](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage).
Only `user:read:chat` is requested. Tokens remain in server memory.

## Prove the first rule

1. Start an OBS recording that excludes configuration files and developer secrets.
2. Show the actual Twitch chat and connected application status together.
3. Send `!rule Every third coin flips gravity for 4 seconds` in your real channel.
4. Show exactly one proposal with the real viewer's name and the interpreted
   condition/effect. Confirm it has not started automatically.
5. Approve that proposal and start the round. Move to collect three coins.
6. Record normal gravity at coins one and two, upward motion on coin three,
   the four-second effect countdown, and normal gravity after expiry.
7. Demonstrate a solid ceiling/platform underside. A repeat trigger should
   refresh the timer, never toggle to normal early or stack a permanent effect.
8. Stop the round while reversed and show immediate cleanup. In a separate
   run, let all 75 seconds elapse and confirm automatic completion.
9. Send an unsupported request and show that it cannot be approved. Try a
   rapid second proposal from one viewer and observe the ten-second cooldown.
10. Disconnect Twitch, then reconnect. Show the status transition; do not imply
    messages sent during a lost connection will be replayed.
11. On stop and automatic expiry, wait for **Saved to PostgreSQL**, then download
    the round record. Confirm `message_id` matches the real proposal and final
    coins include the last collected coin. Check the stored `result_saved`
    column through your existing PostgreSQL 18 instance. The download must be
    `TWITCH_CONTROLLER_RECORD`, still requiring this manual live review.
12. In rehearsal, download a result and confirm it says `LOCAL_REHEARSAL` and
    `browser_only`. A pending/failed database acknowledgement must not appear as
    saved. Keep the controller open during retries; recovery lasts until 30
    seconds after the server deadline. No automatic retry reopens a closed round.

Keep one controller tab. OBS Window Capture of that same tab is suitable for
the first milestone. A separate synchronized overlay is still future scope;
do not run a second simulated game as evidence of overlay synchronization.

## Save the evidence

Record UTC/WIB time, real chat message ID (available in the proposal state),
proposal/round IDs, channel and proposer, and timestamps for trigger/expiry.
Save the OBS clip reference, screenshots at 1280×720, any observed failures,
and the PostgreSQL integration result. Update `PROGRESS.md` only with what was
actually observed. Do not publish private chat outside this consented test.

```text
Evidence kind: REAL_TWITCH
Tested at:
Channel / proposer:
Chat message ID:
Proposal ID / round ID:
Third coin / reversal / expiry timestamps:
Repeated trigger outcome:
Stop / automatic round end outcomes:
Database persistence result:
Connection loss / reconnect outcome:
OBS clip / 720p screenshots:
Known failures:
```

Twitch requires [token validation at startup and hourly](https://dev.twitch.tv/docs/authentication/validate-tokens/).
The adapter implements those checks plus refresh before expiry; a revocation or
failed refresh requires reconnecting. Restarting the backend clears tokens.

## Completion gate

Only mark milestone one complete after a real message has persisted, been
approved and changed actual gameplay, with expiry observed. Then proceed to
AI-provider access/budget verification, schema-based interpretation, actual
game preview, temporary platforms and a synchronized OBS overlay.
