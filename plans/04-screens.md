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

### Post-deploy fix — 2026-08-27

Steve reported that entering the passcode and picking a name failed with
"Something went wrong". Two real bugs, one of them serious.

**The CORS allow-list was incomplete.** The function allowed
`authorization, content-type`; supabase-js also sends `x-client-info` and
`apikey`. The browser's preflight was rejected, so the claim request never left
the page — **the app was unusable for every real user** while
`npm run verify:supabase` reported 8/8, because Node performs no preflight.

The diagnosis came from the data rather than the code: `claim_attempts` held no
row at all for Steve's attempt, not even a failed one, which proved the function
never executed and eliminated the whole passcode-and-claim path in a single
query.

**The client hid the cause.** A request that never completes has no HTTP status,
and the mapping collapsed that into `server_error` — so a browser-side CORS block
was reported as a server fault, aiming any debugging at the wrong machine. A
missing status is now `unreachable`, with its own message.

Both are now covered: `verify:supabase` performs a real preflight asking for the
exact header set a browser sends, and fails if any is missing. Confirmed
end-to-end in a headless browser against the live site — a wrong passcode now
returns a genuine 403 and reads "That code isn't right."

Also fixed: the code field is focused on load, so typing works without tapping
first.

### Two bugs found by auditing what was left — 2026-08-27

Both were found by asking what remained rather than by anything failing.

**Realtime never fired.** `watchAvailability` subscribed to `postgres_changes`
on `availability`, but the table was never added to the `supabase_realtime`
publication. Postgres publishes nothing for an unpublished table, so the
subscription reported SUBSCRIBED and then sat silent forever — a failure mode
with no error anywhere. Fixed by `0002_realtime.sql`.

Worth recording: the first verification **after** that migration still showed no
events. The table was correctly in the publication; Realtime's cache was stale.
It passed on the next attempt. Had I trusted the first result I would have gone
looking for a second bug that did not exist.

**No way out of a wrong name.** Six people share one passcode and pick from a row
of six names, so somebody was going to tap the wrong one — and would then have
been that person on that phone permanently, marking someone else's calendar, with
no recourse short of clearing site data. `SessionFooter` adds "Not you?", behind
a confirmation, because signing out costs re-entering the passcode and that is a
mean thing to inflict on a mis-tap.

Signing out leaves `members.claimed_by` pointing at the dead session. That is
harmless — claiming overwrites whoever held the row — and releasing it properly
would need the edge function for no gain.

`verify:supabase` now covers realtime delivery, gated on a service-role key and
skipped loudly without one. **10/10 checks pass.**

### Desktop layout — 2026-08-27

The design's desktop breakpoint is 1040px, so it is a named token
(`--breakpoint-desk`) rather than a framework default rounded to 1024.

- **Availability Report** is now two columns above 1040px: the heat grid, and a
  fixed 230px rail with a left border carrying the selected-date detail and an
  explicit `HeatLegend` — seven swatches, each drawn hatched, because the ramp
  reads intuitively on its own but "diagonal lines mean somebody has not
  answered" does not. Cells go to 82px tall with a 20px score numeral.
- **Mark Availability** puts the month nav and both actions on one line, with
  the long month label and the name of whose calendar is open. Cells 66px tall,
  9px gaps, 22px glyphs.
- **Best Dates stays at mobile width**, centred. The design draws it at 390 only,
  and stretching six cards across 1040px would make it harder to read aloud —
  which is the entire job of that screen.

Mobile is unchanged except for one improvement the desktop work surfaced: the
action buttons now sit directly under the month nav, which is what the mobile
artboard shows and what the previous build had wrong.

`npm run shot` now captures four images — mobile and desktop, light and dark.

### A flake and a process failure

One `npm test` run showed 2 failures. They could not be reproduced in eight
subsequent runs, including under deliberate load; that run took 23.8s of test
time against a normal 9.2s, so it was resource contention with a concurrent
build. `testTimeout` is now 20s so a busy machine does not masquerade as a bug.

The worse problem was mine: I gated the deploy on `npm test 2>&1 | tail -4 &&
npm run deploy`. A pipeline reports `tail`'s exit status, so it deployed with
failing tests, and the truncation discarded the names of the two failures.
`npm run deploy` now runs `typecheck && test && build` itself, so the gate
cannot be bypassed by how it is invoked. Recorded in `tasks/lessons.md`.

### Still owed

- **T1–T9 in `TestScript.md` have not been run.** They need a real phone and, for
  T4, two of them. T8's colourblind check is the one I would not skip.
