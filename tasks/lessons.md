# Lessons

Patterns captured after a correction from Steve. Add an entry only when a
correction revealed a *repeatable* pattern — volume here costs attention at
every session start.

## A Node check does not prove a browser works — 2026-08-27

`npm run verify:supabase` passed 8/8 against the live project while the app was
broken for every real user. The claim endpoint's CORS config allowed
`authorization, content-type`, but supabase-js also sends `x-client-info` and
`apikey`. A browser's preflight was rejected, so the request never left the page.
Node does no preflight, so every check passed.

**Rule:** when a verification script exercises something a browser will call,
either drive it from a real browser or explicitly check the browser-only layer
(preflight, cookies, mixed content, storage). "It works from curl/Node" is not
evidence about a browser.

**Second rule, from the same bug:** never collapse "the request failed to leave
the browser" into a generic server error. The client mapped a missing HTTP status
to `server_error`, so the UI said "Something went wrong" for what was actually a
CORS block — pointing debugging at the server instead of the browser. Absent
status now maps to `unreachable` with its own message.

**Also:** the fastest diagnosis here came from the data, not the code. The
`claim_attempts` table had *no row at all* for the user's attempt — not even a
failure — which proved the function never ran and ruled out the entire
passcode/claim path in one query. Log the attempt, not just the outcome.
