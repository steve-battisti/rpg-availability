# Plan 03 — Supabase data layer

Schema, row-level security, and the passcode → anonymous session → claim flow.
Independent of the visual direction. Requirements covered: R1 (identity),
R3 (permissions), and the storage half of R2/R4.

Depends on: plan 01 (domain types). Independent of plan 02.

## Tasks

- [x] `supabase/migrations/0001_init.sql` — `members`, `availability`,
      `claim_attempts`, the status enum, helper functions, RLS policies, seed
- [x] `supabase/functions/claim-member/` — server-side passcode verification,
      rate limiting, and the only write path to `members.claimed_by`
- [x] `src/data/supabase.ts` — client
- [x] `src/data/session.ts` — anonymous sign-in, roster, current member, claim
- [x] `src/data/availability.ts` — range read, bulk write, realtime subscription
- [x] `src/lib/permissions.ts` — `canEdit` / `editableMembers`, as domain policy
- [x] `src/data/seed.test.ts` — drift guard between the SQL seed and `roster.ts`
- [x] `supabase/README.md` — setup steps and the honest security description
- [x] `.env.example`

## Review — 2026-08-27

**Applied and verified against the live project** `nwiszvzmvhygwxnqqgtz`.
`npm run typecheck` clean, **123 tests** green, and all **8 live checks** in
`npm run verify:supabase` pass.

### Verified against the real database

A green `db push` only says the SQL parsed. `scripts/verify-supabase.mjs` checks
what actually matters, against the deployed project:

| Check | Result |
|---|---|
| Anonymous sign-in is enabled | ok |
| Roster seeded — Steve, Katie, Mike, Fran, Rob, JT | ok |
| Steve is the only admin | ok |
| RLS blocks writing an unclaimed member's availability | ok — `42501` |
| RLS blocks claiming a member directly | ok — no row changed |
| `claim_attempts` unreadable by clients | ok |
| `claim-member` deployed, rejects a bad passcode | ok — HTTP 403 |
| `claim-member` refuses an unknown member | ok — HTTP 403 |

**R3 is now enforced by the database, not by a disabled button.** The fourth and
fifth rows are the ones that matter: an anonymous session that has not claimed a
member cannot write anyone's calendar, and cannot claim one for itself.

One detail worth keeping: the unknown-member case returns **403, not 404**,
because the function checks the passcode before it looks the member up. That is
the right order — it means someone without the passcode cannot probe which
member ids exist.

The check never needs the passcode; the negative cases are the informative ones,
and a rejected wrong passcode is exactly what proves the function verifies it.
Each run leaves one anonymous user and one failed attempt row, which is harmless:
the rate limit keys on the session id and every run gets a fresh one, so it can
never lock out a member.

### The core decision

The browser holds a durable **anonymous** session — that is the "name in a
cookie" the band asked for. On its own it grants nothing. Entering the band
passcode calls an edge function that verifies it **server-side** and writes that
session's uid onto a member row. RLS then compares `auth.uid()` to
`members.claimed_by` on every write.

The passcode is never checked in the browser. A client-side check is theatre:
the bundle is public, the anon key ships inside it, and anyone can skip it. It
would protect nothing while creating the impression that it did.

### What is verified locally, and how

`src/data/seed.test.ts` reads the migration and asserts against it, because the
roster now exists in two places and two copies of six people is exactly what
drifts:

- the six seeded rows match `ROSTER` in id, name, admin flag and order
- RLS is enabled on **every** table the migration creates
- the availability write policy is owner-or-admin in both `using` and
  `with check` — a policy with only `using` would let a member reassign a row to
  someone else on write
- **no client write policy exists on `members`.** If one is ever added, any
  anonymous session could claim any member and the whole model collapses. The
  test fails if it appears.

`src/lib/permissions.test.ts` covers `canEdit` as pure domain policy, including
the signed-out case. It is deliberately *not* the enforcement point — RLS is —
and the file says so, so nobody later mistakes it for the lock.

### Honest limits

- **Four digits is 10,000 guesses.** The defences are 8 failed attempts per 15
  minutes, an unlisted URL, and six known users. Proportionate for a band
  calendar; not proportionate for anything else.
- The rate limit keys on the anonymous session id, which an attacker can churn
  by minting fresh sessions. It is a speed bump, described as one in the code
  rather than dressed up.
- Claiming a member **overwrites** whoever held it. That is what makes "sign in
  on a new phone" work, and it means anyone with the passcode can become anyone.
  Everyone with the passcode is in the band, so this is a deliberate trade.

### Notable choices

- **Clearing a date deletes its row.** No null status. "No answer" gets exactly
  one representation in the database so it cannot drift out of step with the
  domain's unknown state.
- **`setStatus` takes a run of days**, so "mark rest of month free" is one round
  trip rather than thirty-one. A one-tap action that fires 31 requests does not
  feel like a one-tap action.
- **`updated_by` is recorded separately from `member_id`**, so an admin editing
  someone else's calendar leaves a trace. That is precisely the case where you
  later want to know who did it.
- `fetchMarks` does not page. Six people over six months is ~1,100 rows at worst.

### Still owed

Nothing outstanding from this plan, but two defects in what it shipped were found
later and are worth recording here, next to the code they belong to:

- **CORS was incomplete.** The claim function allowed only
  `authorization, content-type`; supabase-js also sends `x-client-info` and
  `apikey`, so browser preflight was rejected and no claim could ever succeed
  from a real browser. Fixed, and `verify:supabase` now performs a genuine
  preflight with the browser's header set. See `tasks/lessons.md`.
- **Realtime was never published.** `availability` was missing from the
  `supabase_realtime` publication, so the subscription this plan shipped
  reported SUBSCRIBED and then stayed silent forever. Fixed by
  `supabase/migrations/0002_realtime.sql`, with delivery now checked live.

Both shared a shape: the verification passed while the feature was broken,
because the check did not exercise the layer that was failing.
