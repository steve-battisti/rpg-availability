# Plan 02 — App shell and the Mars Funk theme system

Chosen direction: **option 1b, "Mars Funk"**. Spec of record is
`design/mars-funk/README.md`; screenshots in `design/mars-funk/screenshots/`.
Fidelity is stated as high — colors, type, spacing and copy are final, so this
plan is about building the token system faithfully, not reinterpreting it.

Depends on: plan 01 (scoring core), which is done.

## Scope

The runnable app shell plus every visual primitive the three screens will need.
**No screens in this plan** — they are plan 04, and they go faster once the
tokens and the heat ramp are already proven.

## Tasks

- [ ] Vite + React 19 + TypeScript, folded into the existing `src/` tree so the
      domain modules stay where they are and stay UI-free.
- [ ] Tailwind CSS v4 with the Mars Funk palette declared as `@theme` tokens —
      light and dark pairs for bg, surface, ink, ink-muted, border, accent, and
      the four status colors.
- [ ] Bungee + Karla via Google Fonts, with real fallback stacks. Bungee is a
      heavy display face; check the first-paint weight on a phone.
- [ ] Theme toggle, persisted per user, defaulting to the system preference.
- [ ] `src/lib/heat.ts` — the heat ramp as a pure function, unit-tested:
      `level = clamp(round(score), 0, 6)`, then the documented light/dark
      saturation and lightness formulas, the ink threshold, and whether the
      hatch overlay applies (`silentCount > 0`).
- [ ] `src/lib/format.ts` — score formatting. The design shows half scores as
      "5½", not "5.5"; that glyph choice belongs in one tested function rather
      than scattered through JSX.
- [ ] Shared primitives: card frame, pill button, status glyph, member row.
- [ ] `npm run build` clean, `npm run typecheck` clean, tests green.

## Notes on faithfulness

- **Never red.** The spec is explicit: "unavailable" is a neutral rust-brown and
  the heat scale stays in the green family. This is the colorblind mitigation, so
  it is not a stylistic preference to be relaxed later.
- Every state carries a **glyph** (✓ / × / ? / blank) and every heat cell carries
  a **numeral**, plus a **hatch** when anyone is silent. Color is never the only
  channel. Any component that drops the glyph or the numeral to save space has
  broken the design's core accessibility claim.
- The accent rust is **chrome only, never data** — brand and borders, not status.

## Roadmap after this

- **Plan 03 — data layer.** Supabase schema, RLS policies, and the
  passcode → anonymous session → claim-your-member-row flow. Independent of the
  visuals; could run in parallel.
- **Plan 04 — screens.** Entry, Mark Availability, Availability Report, Best
  Dates, wired to plans 01–03.

## Open questions raised by the design

These need Steve's call before plan 04. None of them block plan 02.

1. **Admin editing others has no design.** R3 says the administrator may edit
   anyone's availability, but Mars Funk has no member-switcher anywhere — Steve's
   Entry pill carries an "Admin" tag and that is the only trace of the
   capability. Something has to be designed or the requirement quietly dies.
2. **"Mark rest of month free" and past dates.** The spec says it sets every
   *currently-unset* date in the *visible month*. Opened on October 20th, does it
   backfill October 1st–19th? Assumption unless told otherwise: it applies from
   today forward and never touches the past.
3. **A 4-digit passcode is 10,000 guesses.** Fine for six friends behind an
   unlisted URL, but it wants server-side rate limiting rather than none.
