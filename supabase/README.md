# Supabase setup

Project: **`nwiszvzmvhygwxnqqgtz`** — https://nwiszvzmvhygwxnqqgtz.supabase.co

**Status: applied and verified against the live project (2026-08-27).**
All 8 checks in `npm run verify:supabase` pass — anonymous sign-in is on, the
roster seeded, RLS denies writing an unclaimed member's calendar and denies
claiming a member directly, `claim_attempts` is unreadable by clients, and
`claim-member` is deployed and rejects a wrong passcode.

Re-run that check any time the schema or the function changes:

```bash
npm run verify:supabase
```

One check is optional: realtime delivery needs a service-role key to write a row
the anonymous session can then observe. It is skipped, loudly, without one:

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run verify:supabase
```

Worth running after any migration. Adding a table to the `supabase_realtime`
publication is easy to forget, and a subscription to an unpublished table
succeeds and then stays silent forever.

## Setup

Log in once, so the CLI has a token:

```bash
npx supabase login
```

Then run everything else in one go, with the real passcode in place of `1234`:

```bash
./scripts/setup-supabase.sh 1234
```

That links the project, pushes the schema, enables anonymous sign-ins, salts and
hashes the passcode into an edge function secret, and deploys `claim-member`. It
is idempotent — safe to re-run.

The passcode never leaves the machine you run it on. Only a salted SHA-256 is
stored, and neither the hash nor the salt reaches the browser.

Last step, by hand: put the anon key in `.env.local` from
Project Settings → API → **anon public**.

## How the permission model actually works

The browser holds an **anonymous** Supabase session. It is durable — this is the
"name in a cookie" the band asked for — but on its own it grants nothing.

Entering the band passcode calls `claim-member`, which verifies the passcode
**server-side** and writes that session's uid onto a row in `members`. From then
on, RLS compares `auth.uid()` to `members.claimed_by` on every write. A member
can write their own dates; the admin can write anyone's.

Two things follow that are easy to get wrong later:

- **Never check the passcode in the browser.** The bundle is public and the anon
  key ships inside it. A client-side check can be skipped by anyone who opens
  devtools, so it protects nothing and creates the false impression that it does.
- **Never add a client write policy on `members`.** There is deliberately none.
  If one appears, any anonymous session can claim any member, and the whole model
  collapses. `src/data/seed.test.ts` fails if one is added.

## The passcode is a speed bump, honestly described

Four digits is 10,000 guesses. The defences are: the function refuses after 8
failed attempts in 15 minutes, the URL is unlisted, and there are six known
users. That is proportionate for a band calendar and it is not proportionate for
anything else. The rate limit keys on the anonymous session id, which a
determined attacker can churn — tighten it to IP if it is ever actually abused.
