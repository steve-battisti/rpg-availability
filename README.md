# Red Planet Groove — Availability

Private calendar-availability tracker for a six-piece band. Members mark dates
Available / Unavailable / Maybe; the band reads a combined report and gets
ranked suggestions for gig nights (Fri–Sun) and practice nights (Mon–Thu) over
the next six months.

```bash
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
```

## Where things are

| Path | What |
|---|---|
| `concepts/rpg-availability.md` | Requirements of record (R1–R7) |
| `concepts/tech-proposal.md` | Stack, identity model, schema sketch |
| `design/claude-design-brief.md` | Brief handed to Claude Design |
| `plans/` | One plan per shipped thing, with checkboxes and a review |
| `src/lib/` | Pure domain logic — no UI, no network |

## Domain rules worth knowing before reading the code

- **Dates are `YYYY-MM-DD` strings.** No `Date` objects with times anywhere in
  the domain; arithmetic runs on `Date.UTC` so the calendar cannot shift by
  timezone or DST.
- **Unmarked means "unknown", never "available".** Unknown members score zero and
  are reported by name, so a date with 3 yes / 3 silent is always distinguishable
  from 3 yes / 3 no.
- **A Maybe is worth half a yes.** Ranking is `score desc, then date asc` and
  nothing else — `unknownCount` is reported for display but never sorts.
