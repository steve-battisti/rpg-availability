# Tech proposal — Red Planet Groove Availability

Status: **stack proposed; the four product decisions below are settled (2026-08-27).**

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + TypeScript + Vite | Fast, boring, deploys as static assets |
| Styling | Tailwind CSS v4 | Token-driven; the design mockups hand off cleanly |
| Server state | TanStack Query | Optimistic date toggles; a tap must feel instant on a phone |
| Dates | date-fns, dates as `YYYY-MM-DD` strings | No `Date` objects with times. Kills every timezone bug |
| Data | Supabase Postgres + Row Level Security | Already have the account; RLS makes "edit only your own" a database rule |
| Identity | Supabase Auth **anonymous sign-in** + band passcode | See below |
| Live updates | Supabase Realtime | Report updates while the band is comparing notes |
| Hosting | Cloudflare Pages | Static build, free, already have the account |
| Tests | Vitest | The date-scoring logic is the only thing worth unit-testing |

## Identity — the one real decision

Steve asked for "enter a name, persisted in a cookie." That is an identity
convenience, not a security boundary — and R3 ("only edit your own") is a real
rule. Proposed reconciliation:

1. First visit: enter the shared **band passcode**, then pick your name from the
   six-person roster.
2. The app performs a Supabase **anonymous sign-in**, giving that browser a
   durable `auth.uid()`. That uid is written to the chosen member's row.
3. RLS: a user may write `availability` rows only where the member's claimed uid
   matches `auth.uid()`. The admin's member row carries `is_admin`, and the
   policy grants that uid write access to every member.

Result: no email, no password to forget, session persists exactly like the cookie
Steve asked for, and the permission rule is enforced in Postgres rather than in
the UI. A new device re-enters the passcode and re-claims.

Rejected: magic-link email (six musicians, six inboxes, friction); no gate at all
(R3 becomes decoration); Cloudflare D1 + hand-rolled sessions (cheaper vendor
count, but we'd be writing the auth Supabase already has).

## Schema sketch

```sql
members(id uuid pk, display_name text, is_admin bool, claimed_by uuid null, sort int)
availability(member_id uuid, day date, status enum('available','unavailable','maybe'),
             updated_at timestamptz, primary key (member_id, day))
```

Only marked days have rows. **A missing row means "no answer", not "available"** —
it contributes 0 to every score and is surfaced as an explicit unknown count.
This makes bulk-marking a first-class UI requirement, not a nicety.

## Scoring — best gig / practice dates

Pure function over the next 180 days, unit-tested, no database logic:

```
score(day) = count(available) + MAYBE_WEIGHT * count(maybe)
gig days      = day-of-week ∈ {Fri, Sat, Sun}
practice days = day-of-week ∈ {Mon, Tue, Wed, Thu}
rank by score desc, then date asc
```

`MAYBE_WEIGHT = 0.5` — settled. **No member is required**: a date is ranked by
count, never disqualified by whose name is missing. Every ranked date also
carries `unknownCount` so a thinly-answered date cannot masquerade as a strong one.
