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

**Written and typechecked. Not yet run against a live Supabase project** — none
exists yet. `npm run typecheck` is clean and the suite is at **123 tests**, but
everything that needs a real database is unverified until the first `db push`.
That is stated at the top of `supabase/README.md` too, because a green test run
here says nothing about whether the SQL applies.

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

- **Nothing here is proven until a Supabase project exists.** Steve needs to run
  the six steps in `supabase/README.md`; the first `db push` is the real test.
- Plan 04 — the four screens, plus the admin "viewing as" switcher, which the
  Mars Funk design does not cover and which `editableMembers` now supports.
