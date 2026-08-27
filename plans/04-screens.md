# Plan 04 — The four screens

Entry, Mark Availability, Availability Report, Best Dates, wired to the domain
(plan 01), the theme (plan 02) and the live database (plan 03).

Requirements covered: R2, R3 (UI half), R4, R5, R7.

## Tasks

- [x] `src/lib/clock.ts` — the one place the real clock is read
- [x] `src/lib/month.ts` — month grids, navigation, date labels
- [x] `src/data/useBandData.ts` — roster, marks, optimistic writes, realtime
- [x] `src/screens/EntryScreen.tsx`
- [x] `src/screens/MarkScreen.tsx` — cycle, bulk mode, mark-rest-free, admin switcher
- [x] `src/screens/ReportScreen.tsx` — heat grid, silent tags, detail panel
- [x] `src/screens/BestDatesScreen.tsx`
- [x] `src/App.tsx` — session gate and tab navigation
- [x] `src/dev/` + `preview.html` — fixture-backed design preview
- [x] Behaviour tests for all three calendar screens
- [x] `TestScript.md`

## Review — 2026-08-27

**Shipped.** `npm run build` clean, `npm run typecheck` clean, **186 tests**
green. All four screens screenshotted in both themes and compared against
`design/mars-funk/screenshots/`.

### Three decisions worth defending

**1. No TanStack Query, contradicting the original tech proposal.** I proposed
it; building it, it did not earn its weight. This is two reads and one write over
six people's data. `useBandData` does optimistic application and a realtime
refetch in less code than wiring a `QueryClient`, and it keeps the optimistic
path visible in one place instead of spread across cache-invalidation rules. The
tech proposal is now wrong on this point and the hook says why.

**2. "Mark rest of month free" never backfills the past.** The design says "every
currently-unset date in the visible month" and is silent on dates already gone.
Marking yesterday available is meaningless and would pollute the report, so it
applies from today forward. Pinned by a test, because it is the exact kind of
rule that regresses quietly.

**3. Navigation is an addition, not a reproduction.** Mars Funk is four
standalone artboards with no navigation chrome at all. The tab row is built from
the design's existing pill vocabulary rather than a new one, but it is mine and
should be reviewed as such.

### The admin switcher

The design had no member-switcher anywhere, so this is new work against R3. An
"Editing" pill row appears **only** for the admin, and switching to someone else
raises a standing warning that you are not editing your own calendar. Switching
member also drops any pending bulk selection — carrying a selection across a
member switch would be a genuinely dangerous mis-tap.

`editableMembers` gates the UI, and RLS gates the database. The UI check exists
so a control can be absent rather than present-and-failing; it is not the lock.

### `preview.html`

The app now needs a claimed Supabase session, which means design fidelity could
no longer be checked without credentials. `preview.html` renders the **real**
screen components against deterministic fixture data and imports nothing from
`src/data`, so it cannot touch the live project. `npm run shot` points at it.

The fixtures are deliberately awkward — someone on tour, someone who only marks
weekends, and JT, who has never opened the app. A calendar where everybody
answered is the one case that cannot show whether "unknown" renders correctly.

### Accessibility carried through

- Every date cell announces its state (`"2026-10-16 — Maybe"`), so the glyph is
  not the only cue for a screen reader either.
- Report cells announce the score, the band size, and the unanswered count —
  the hatch has a spoken equivalent.
- Bulk apply buttons have real labels ("Mark selected unavailable"), not just a
  glyph.
- One real input behind four code boxes, so phones show a numeric keypad and
  autofill works. Four single-character inputs famously break both.

### Deployed

**https://rpg-availability.pages.dev** — Cloudflare Pages project
`rpg-availability`, redeploy with `npm run deploy`.

Verified live rather than trusting the upload: the page loads with no console
errors, anonymous sign-in fires, and the six roster pills are read from the real
database, which means `members_read` under RLS works for an anonymous session.

Caught and fixed in the process: the wordmark rendered **twice** on Entry — once
in the shell header and once inside the card where the design puts it. The header
wordmark is now suppressed until a member is signed in.

Two deployment choices worth recording:

- **`preview.html` is excluded from production builds.** It is gated behind
  `BUILD_PREVIEW`, which only `npm run shot` sets. It holds no credentials and
  cannot reach the database, but a public page showing a fake band calendar would
  only confuse whoever found it. (Requesting `/preview.html` on the live site
  returns the app itself, via the SPA fallback.)
- **`public/_headers` and `public/robots.txt`.** `X-Frame-Options: DENY`,
  `nosniff`, a referrer policy, and a locked-down permissions policy; robots
  disallows everything, because this is a private tool for six people.

### Still owed

- **T1–T9 in `TestScript.md` have not been run.** They need a real phone and, for
  T4, two of them. T8's colourblind check is the one I would not skip.
- The design specifies desktop layouts for the two calendar screens; only the
  mobile layout is built. It scales acceptably but is not the two-column desktop
  report from the spec.
