# Handoff: Red Planet Groove — Availability App (Mars Funk, option 1b)

## Overview
A private, six-person band-availability tool. Members mark themselves Available / Unavailable / Maybe / (unset) on a month calendar; everyone reads a combined report of who's free on which date; the app surfaces the best upcoming gig nights (Fri–Sun) and practice slots (Mon–Thu). No public/marketing surface — six friends, mobile-first, used mid-conversation on a phone.

This package documents **option 1b, "Mars Funk"** — the retro-space, band-personality visual direction, chosen from three explored approaches.

## About the Design Files
The bundled file (`reference/Red Planet Groove.dc.html`) is a **design reference built in HTML** — a working prototype of look, layout and interaction, not production code to copy directly. It also contains two other explored visual directions (1a, 1c) side by side for context; **only the "Mars Funk" (1b) column is in scope for this build**. Recreate the 1b screens in the target codebase's real environment (React Native, SwiftUI, Vue, etc. — whatever this project already uses, or the best fit if nothing exists yet) using its own component/state patterns, styled to match the values below pixel-for-pixel.

## Fidelity
**High-fidelity.** Colors, type, spacing and copy below are final. Recreate pixel-perfectly; do not restyle with a different design system.

## Roster (real data, use verbatim)
Steve (admin), Katie, Mike, Fran, Rob, JT. Note initials/name widths vary a lot ("JT" vs "Katie") — any chip/pill component must handle both without truncation or overlap.

## Core interaction model (applies to every screen)
Four visual states per date, per person: **Available**, **Unavailable**, **Maybe**, **Unset** (no answer yet — the default/most common state, must read as calm/empty, never as an error).
- Never encode state or heat level in color alone (red/green color-blindness is the main risk on a green heat scale). Every state also carries a **glyph**: ✓ available, × unavailable, ? maybe, blank = unset. Every heat cell also carries a **numeral** (score) and a **hatch texture** when not everyone has answered (see Availability Report).
- Tapping a date cell in "Mark Availability" **cycles** it: unset → available → maybe → unavailable → unset.
- **Bulk marking** (required fast path, must work one-handed): a "Select multiple" toggle switches cells into multi-select mode; tapping cells toggles selection (outlined in the accent color); a small action bar appears showing the selection count plus three one-tap buttons (✓ / ? / ×) that apply that state to every selected date and exit bulk mode.
- **"Mark rest of month free"** button: single tap sets every currently-unset date in the visible month to Available. This is the dedicated fast path for "I'm free the rest of the month."
- **Light/dark mode**: a single toggle switches the whole screen's theme; all colors below are given as light/dark pairs.

## Screens

### 1. Entry
**Purpose:** Enter the shared band passcode, then pick your name. Shown once — returning users skip straight to the calendar.
**Layout:** Single column, mobile only (390px reference width), generous vertical padding (28px top/bottom, 22px sides), rounded card frame (24px radius, 3px accent-colored border).
**Components:**
- Wordmark "RED PLANET GROOVE" set in Bungee, 22px, two lines, color = accent (rust).
- "Enter the mission code" label, Karla 13px, muted ink.
- 4-digit passcode row: four boxes, 40×48px, 12px radius, 2px accent border, each showing a placeholder dot (Bungee 22px) — represents a masked digit input.
- "Who's on the mission?" label, Karla 13px muted.
- Roster picker: wrapping row of pill buttons, one per roster member, 12px vertical / 16px horizontal padding, 20px radius, 2px border. Default state: surface background, border color = border token. Selected state (tap): background/ink switch to the "available" status color pair (this doubles as the "picked" affordance — no separate accent needed), border = accent. Steve's pill carries a small "Admin" tag in muted ink.
- Footer note, 11px muted: "One tap and you're in. Returning members skip this."

### 2. Mark Availability (month calendar)
**Purpose:** The highest-frequency screen — a member sweeps through a month marking their own availability.
**Layout (mobile 390):** Card frame as above. Header row: "‹  OCT 2026  ›" month nav (Bungee 16px for the label, chevrons decorative/inactive in this mock but should be wired to real month navigation). Below that, two action buttons side by side: "Mark rest of month free" (flex:1, pill, uses the available-status color pair) and "Select multiple" / "Apply to N" toggle (pill, neutral border). When bulk mode is active, a row appears: "{n} selected" + right-aligned ✓ / ? / × apply buttons (each a small 2px-border pill in its own status color).
Weekday header row: 7-column grid, Bungee 10px, muted ink, centered.
Calendar grid: 7-column grid, 5px gaps, one row per week (5–6 rows for the month, leading/trailing blanks empty). Each date cell: square (aspect-ratio 1:1), 10px radius, 2px border, day number small (9px Karla) top-left in muted ink, status glyph centered (16px Bungee).
Legend row under the grid: "✓ free   × busy   ? maybe   empty = TBD" (10.5px Karla, muted).
**Desktop (1040px):** Same structure, wider card, 9px grid gaps, cells fixed 66px tall (not square), glyph 22px, month label 22px, action buttons 12px/14px padding.

### 3. Availability Report (combined heat calendar + detail)
**Purpose:** Read how many of the six are free on any date; see who specifically is in/out/maybe/silent for a selected date.
**Heat encoding (0–6 available-equivalent, Maybe = 0.5):** color is an olive-green ramp (hue ≈ 88°) that gets more saturated and darker/lighter (theme-dependent) as the score rises — see Design Tokens for the exact formula. Every cell **also** shows the numeral score (e.g. "4" or "4½") and, whenever at least one member hasn't answered yet, a diagonal hatch texture overlay plus a small "+n" tag (n = number silent) in the corner — this is what stops a "3 yes / 3 unknown" day from reading identically to a "3 yes / 3 no" day.
**Layout (mobile 390):** Card frame, "OCT 2026 — CREW" header (Bungee 16px, accent color), weekday header row, then the same 7-column heat grid (10px radius cells, 2px border — border becomes accent-colored when a cell is the currently-selected date). Below the grid: a divider, then the **detail panel** for the selected date — date title (Bungee 15px, accent), then one row per roster member: name (Karla bold 13px) + status glyph (Bungee 15px), row background tinted with that member's own status color, 12px radius pill rows.
**Desktop (1040px):** Two-column layout — heat grid on the left (as above, cells 82px tall, showing day number + silent-count in the corner and score centered), a fixed 230px-wide right rail on the right (2px left border) holding: selected-date detail (same member rows as mobile) plus an explicit **heat legend**: 7 swatches (0/6 through 6/6), each showing the ramp color + "hatch = someone silent" caption.

### 4. Best Dates
**Purpose:** The "read this aloud on the phone" screen — top gig nights (Fri/Sat/Sun) and top practice slots (Mon–Thu) over the next six months, sorted by score.
**Layout (mobile 390 only):** Card frame, header "BEST DATES" (Bungee 16px, accent). Two sections, each a vertical stack of cards:
- "🎸 GIGS · FRI–SUN" — cards with 2px accent border, 16px radius, 14px padding: left side shows date label (Bungee 16px) + relative sub-label ("This week" / "Next week" / month name, 10.5px muted) in Karla; right side shows the score in large Bungee 26px with a small "/6" suffix, colored via the same heat ramp as the Report screen.
- "🥁 PRACTICE · MON–THU" — identical card style but with a neutral (border-token) border instead of accent, to visually de-emphasize versus gig dates.
Minimum four cards per section in the mock; real data should show as many top dates as exist, most-available first.

## Interactions & Behavior summary
- Tap date cell (Mark screen) → cycle state (unset→available→maybe→unavailable→unset).
- Tap date cell (Report screen) → select it as the detail panel's subject.
- Toggle "Select multiple" → enters bulk mode; tapping cells toggles a selection outline; tapping ✓/?/× applies to all selected and exits bulk mode.
- "Mark rest of month free" → sets every unset date in the open month to Available, one tap.
- Theme toggle → swaps every color below between its light and dark value; no layout change.
- Roster pill tap (Entry) → selects that identity (in the real app this should also submit and route into the calendar).
- Month chevrons → navigate to previous/next month (decorative in the mock; wire to real data).

## State Management
- `myAvailability: Record<isoDate, 'available'|'unavailable'|'maybe'|undefined>` — the signed-in member's own marks; undefined = unset.
- `bandAvailability: Record<isoDate, Record<memberId, 'available'|'unavailable'|'maybe'|undefined>>` — combined roster data backing the Report and Best Dates screens; a missing/undefined entry = that member hasn't answered ("silent"), distinct from an explicit "unavailable".
- `theme: 'light'|'dark'` (per-user preference, persisted).
- `bulkMode: boolean`, `bulkSelection: Set<isoDate>` — Mark screen only, transient.
- `selectedDate: isoDate` — Report screen only, drives the detail panel.
- `visibleMonth: {year, month}` — drives calendar/report grid and month nav.
- Derived per date: `score = available*1 + maybe*0.5`, `silentCount = 6 - (available+unavailable+maybe)`; used for heat color, numeral, hatch, and Best Dates ranking (gig = Fri/Sat/Sun sorted desc by score; practice = Mon–Thu sorted desc by score).

## Design Tokens

**Typography**
- Display / numerals / headers: `'Bungee', cursive` (Google Fonts) — used for the wordmark, month labels, glyphs, and all large score numerals.
- Body / labels / names: `'Karla', sans-serif` (Google Fonts), weights 400/600/700.
- Minimum text size on mobile: 9–10px only for muted micro-labels (day numbers, silent tags); all primary content ≥12px, most ≥14–16px per the "read aloud" requirement on Best Dates.

**Radius:** 12px (small pills, passcode boxes, cells) · 16–24px (cards, frame corners) · borders are 2–3px throughout (chunkier than typical UI — part of the "poster" character).

**Colors — Light theme**
| Token | Hex |
|---|---|
| bg | `#fbf3e6` |
| surface | `#fff9ef` |
| ink (primary text) | `#2b1b12` |
| ink-muted | `#8a6b52` |
| border | `#e4d2b4` |
| accent (rust — chrome/brand only, never data) | `#c1502e` |
| available: bg / ink | `#dfe8c4` / `#4b6b1e` |
| unavailable: bg / ink | `#e4d9d6` / `#6b5049` |
| maybe: bg / ink | `#f6dfa8` / `#8a5a12` |
| unset: bg / ink / border | transparent / `#a98f6e` / `#e4d2b4` |

**Colors — Dark theme**
| Token | Hex |
|---|---|
| bg | `#1b1023` |
| surface | `#241531` |
| ink (primary text) | `#f5e8d8` |
| ink-muted | `#b39d8e` |
| border | `#3a2740` |
| accent (rust) | `#e2673f` |
| available: bg / ink | `#33421c` / `#b9d98a` |
| unavailable: bg / ink | `#3a2c28` / `#c9a89e` |
| maybe: bg / ink | `#4a3714` / `#f0c46a` |
| unset: bg / ink / border | transparent / `#8a715a` / `#3a2740` |

**Heat ramp (Availability Report / Best Dates), hue 88° (olive-green), 7 steps for score 0–6:**
- Light theme: `saturation = 35 + level*7%`, `lightness = 94 - level*10%` → `hsl(88 {sat}% {light}%)`. Text ink: `#132015` if level ≥ 4 else `#1c2a1e`.
- Dark theme: `saturation = 30 + level*8%`, `lightness = 14 + level*7%` → `hsl(88 {sat}% {light}%)`. Text ink: `#0e150f` if level ≥ 3 else `#e9f3ea`.
- `level = round(score)`, clamped 0–6.
- Hatch overlay (drawn whenever `silentCount > 0`): `repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 2px, transparent 2px 6px)` on light, `rgba(255,255,255,.10)` on dark.

**Status glyphs (all screens):** ✓ available · × unavailable · ? maybe · (blank) unset.

**Never use red** anywhere in the availability system (colorblind mitigation) — "unavailable" is a neutral rust-brown, not red; the heat scale stays strictly in the green family.

## Assets
No external images/icons. Two emoji are used as section markers on Best Dates (🎸 gigs, 🥁 practice) — replace with in-house iconography if the target app avoids emoji. Fonts are Google Fonts: Bungee, Karla (loaded via `<link>` in the reference file).

## Files
- `reference/Red Planet Groove.dc.html` — full interactive reference (all three explored options; scroll/pan to the "1b" column). Open directly in a browser to explore states, toggle theme, and try the bulk-marking flow.
