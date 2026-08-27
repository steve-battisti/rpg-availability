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

- [x] Vite + React 19 + TypeScript, folded into the existing `src/` tree so the
      domain modules stay where they are and stay UI-free.
- [x] Tailwind CSS v4 with the Mars Funk palette declared as `@theme` tokens —
      light and dark pairs for bg, surface, ink, ink-muted, border, accent, and
      the four status colors.
- [x] Bungee + Karla via Google Fonts, with real fallback stacks. Bungee is a
      heavy display face; check the first-paint weight on a phone.
- [x] Theme toggle, persisted per user, defaulting to the system preference.
- [x] `src/lib/heat.ts` — the heat ramp as a pure function, unit-tested:
      `level = clamp(round(score), 0, 6)`, then the documented light/dark
      saturation and lightness formulas, the ink threshold, and whether the
      hatch overlay applies (`silentCount > 0`).
- [x] `src/lib/format.ts` — score formatting. The design shows half scores as
      "5½", not "5.5"; that glyph choice belongs in one tested function rather
      than scattered through JSX.
- [x] Shared primitives: card frame, pill button, status glyph, member row.
- [x] `npm run build` clean, `npm run typecheck` clean, tests green.

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

---

## Review — 2026-08-27

**Shipped.** `npm run build` clean, `npm run typecheck` clean, **109 tests** green.
Both themes screenshotted and checked against `design/mars-funk/screenshots/`.

### The contrast audit

The design's central accessibility claim is that availability is never encoded in
colour alone. That claim is only worth anything if the ink on the ramp is
actually readable, so `src/lib/heat.test.ts` computes real WCAG contrast for all
seven levels in both themes.

**Result: 13 of 14 combinations clear AA for normal text (4.5:1).** The exception
is dark level 3 at **4.47:1** — a hair under. It is comfortably over the 3:1 bar
that applies to the large Bungee numerals it is actually used for, so the ramp
ships as designed rather than being quietly "corrected". The test pins the
exception by name, so any future change to the ramp surfaces it instead of
burying it.

### Notable choices

- `.dark` class on `<html>`, not the media query alone, so an explicit choice
  beats the OS setting. The hook follows the OS *only* until the user chooses.
- Every `localStorage` access is wrapped — a private window refuses it, and the
  toggle must still work for the session.
- `min-h-11` on every pill and member row. The design's own padding lands close
  to a 44px target; this makes it a floor rather than a coincidence.
- `nextState` and the cycle order live in `src/ui/status.ts`, one tested place,
  because the design specifies an exact cycle:
  unset → available → maybe → unavailable → unset.
- The unset state renders no glyph but still announces "No answer yet" to a
  screen reader, so all four states reach a non-visual user.

### `npm run shot`

Playwright is now a devDependency and `scripts/shot.mjs` screenshots the built
app in both themes at 390px. This is a pixel-fidelity rebuild of a specific
design; "it compiles" proves almost nothing, and this is how a change gets
checked without a human opening a browser.

### Deliberately not done

- **`src/App.tsx` is a throwaway proof harness**, not the app. It renders the
  token gallery, the full heat scale with and without hatch, member rows and a
  Best Dates card, so the primitives could be verified before any screen depends
  on them. Plan 04 replaces it.
- **No `TestScript.md` entry yet.** Still nothing human-verifiable — the proof
  harness is a developer tool. The first human test case arrives with the real
  Mark Availability screen.

### Still owed

Nothing. Plan 03 (Supabase schema, RLS, claim flow) and plan 04 (the four
screens, including the admin "viewing as" switcher this plan flagged as missing
from the design) have both shipped.

One thing this plan built has since been replaced: `src/App.tsx` was a throwaway
token gallery, and plan 04 turned it into the real shell. The gallery's job —
checking the tokens and heat ramp against the design without a live session —
now belongs to `preview.html`.
