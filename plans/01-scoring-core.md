# Plan 01 — Scoring core

Pure domain logic for availability tallying and best-date ranking. **No UI, no
network, no design dependency** — this is deliberately the first thing built
because it is the piece most likely to be subtly wrong and the piece a mockup
can tell us nothing about.

Requirements covered: R4 (report tallies), R5 (best gig/practice dates).

## Design decisions

- **Dates are `YYYY-MM-DD` strings, end to end.** No `Date` objects with times
  anywhere in the domain. Day-of-week and day arithmetic go through `Date.UTC`,
  which is pure integer math with no local-timezone involvement — a member in a
  different timezone must not see the calendar shift.
- **`today` is injected, never read from the clock.** Ranking is a pure function
  of its arguments, so tests can pin a date without freezing time.
- **Unknown is first class.** A tally reports `unknown` members explicitly; it is
  never conflated with `unavailable`.
- **Ranking is spec-faithful and nothing more:** `score desc, then date asc`.
  `unknownCount` is *reported* so the UI can warn, but it does not silently
  reorder results.
- Dates with a score of 0 are excluded from best-dates. A night nobody has said
  yes to is not a candidate.

## Tasks

- [x] `src/lib/day.ts` — day-string primitives (parse, validate, add, weekday,
      range, category)
- [x] `src/lib/availability.ts` — roster/status types, `tallyDay`, `tallyRange`
- [x] `src/lib/bestDates.ts` — `rankBestDates` over a 180-day horizon
- [x] Vitest suites for all three
- [x] `npm run typecheck` and `npm test` green

## Review

See bottom of file after implementation.

---

## Review — 2026-08-27

**Shipped.** `npm run typecheck` clean, `npm test` green at **82 tests** across
three suites.

| Module | What it owns |
|---|---|
| `src/lib/day.ts` | Day-string primitives: validate, add, diff, weekday, range, gig/practice kind |
| `src/lib/roster.ts` | The fixed six-member band, Steve flagged admin |
| `src/lib/availability.ts` | Status types, mark indexing, `tallyDay` / `tallyRange`, `namesOf` |
| `src/lib/bestDates.ts` | `rankBestDates` over the 180-day horizon |

### Things the tests pin down that are easy to get wrong later

- `2026-02-30` and `2025-02-29` are **rejected**, not rolled forward into March.
  `Date.UTC` accepts them silently; the round-trip check catches them.
- Day arithmetic crosses both US DST boundaries (2026-03-08, 2026-11-01) without
  gaining or losing a day.
- An untouched date tallies as six unknowns, never six available.
- 3-yes-3-unknown and 3-yes-3-no score identically but are never conflated, and
  the unknown-heavy date is **not** demoted — the spec says ties break by date,
  and flagging silence is the UI's job.
- Scores are exact: `MAYBE_WEIGHT = 0.5` is binary-representable, so `3.5 === 3.5`
  holds and equality-based tie detection is safe.
- Sorting precedes slicing, so a strong date late in the horizon survives the
  limit while a weak early one does not.
- Marks from someone no longer on the roster are ignored rather than counted.

### Verified beyond the unit tests

Ran a realistic 120-day fixture (one member on tour through September, one who
only marks weekends, one who has never opened the app). Output was correct: the
first viable gig date landed after the tour ended, the silent member appeared as
"no answer" on every date rather than padding the counts, and maybes ranked at
half a person.

### Deliberately not done

- **No `TestScript.md` entry.** Per `CLAUDE.md`, human test cases are for
  human-verifiable changes. This is pure logic with no UI; its verification
  belongs in the harness, and adding a "read the numbers and agree" case would
  be busywork. The first human test case arrives with the calendar screen.
- **No `unknownCount` influence on ranking.** Tempting, and possibly right, but
  it is not what the spec says. Revisit only if the band reports the list is
  misleading in practice.

### Still owed

- Vite + React + Tailwind app shell, pending the chosen visual direction.
- Supabase schema, RLS policies, and the anonymous-session claim flow.
- `plans/02-*` once Claude Design comes back.
