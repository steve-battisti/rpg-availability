# Claude Design brief — Red Planet Groove Availability

Paste everything below the line into Claude Design.

---

Design **three distinct visual approaches** for **Red Planet Groove**, a private
band-availability web app used by six musicians. No marketing site, no signup
funnel — this is a tool six friends open on their phones, often mid-conversation
with a bar owner asking "what nights are you free in October?"

## What it does

Each member marks calendar dates as **Available**, **Unavailable**, or **Maybe**.
Everyone can then read a combined report showing how many of the six are free on
any given date, and the app calls out the best upcoming dates to book a gig
(Fri–Sun) or schedule a practice (Mon–Thu).

## Screens to mock in each approach

1. **Entry** — enter the shared band passcode, then pick your name from a roster
   of six. One tap, then you're in. Shown once; returning users skip it.
2. **Mark Availability** — a month calendar. Every date cell is a three-state
   control the user cycles or picks: Available / Unavailable / Maybe / unset.
   Show the month grid, the state affordance, and month navigation.
3. **Availability Report** — the same month, but each date is heat-coded by how
   many of the six are available (all six = strongest, then 1 missing, 2
   missing, …). A Maybe counts as half. Dates also need to show how many
   members simply **haven't answered** — a date with 3 yes / 3 unknown must not
   look like a date with 3 yes / 3 no. Include the **selected-date detail**
   state: who is available, who is out, who said maybe, who is silent.
4. **Best Dates** — a highlighted panel listing top **gig dates** (Fri/Sat/Sun)
   and top **practice dates** (Mon–Thu) over the next six months. This is the
   screen someone reads aloud on the phone, so the date and the count have to
   be legible at arm's length.

Show each screen at **mobile (390px wide)** and show at least the two calendar
screens at **desktop** too.

## Hard constraints

- **Mobile-first.** 390px is the design target; desktop is the adaptation. Date
  cells must be comfortably tappable and reachable one-handed.
- **Marking a date is the highest-frequency action.** A member sweeping through
  a month should not need a modal per date.
- **Bulk marking is required.** An unmarked date means "no answer" and counts
  for nothing, so a member saying "I'm free all October" must not have to tap
  31 cells. Design a fast path: drag across a run of days, tap a week row, a
  "mark the rest of this month" action — your call, but it has to exist and it
  has to work with a thumb.
- **Unset is the most common state, not an edge case.** Most cells are unset
  most of the time. It must read as calm and empty — never as an error or a
  warning — while still being obviously different from Unavailable.
- **Do not encode availability in color alone.** Red/green is the most common
  form of color blindness and this app's core signal is a green scale. Every
  heat level also needs a non-color cue — a numeral, a fill pattern, a shape,
  a weight change. Make that part of the design, not an afterthought.
- **Six is the whole universe.** The counts are 0–6. Designs can afford to show
  six discrete marks (dots, pips, initials) rather than abstract percentages.
- **Use the real roster** in every mock — Steve, Katie, Mike, Fran, Rob, JT.
  Steve is the admin. Real names of real lengths; no Lorem, no "Member 4".
  Note that "JT" and "Katie" are very different widths — if the design leans on
  initials or name chips, prove it survives both.
- **Light and dark mode** for each approach.
- Three states (Available / Unavailable / Maybe) plus **unset** — four visual
  conditions, and unset must be clearly distinguishable from unavailable.

## Make the three approaches genuinely different

Diverge on **typography, density, and organizing metaphor** — not just palette.
Three different greens is not three approaches. Suggested (not mandatory) axes:

- One that is **quiet and utilitarian** — dense, system-typeface, calendar-as-
  spreadsheet, everything visible at once, no decoration.
- One with **band personality** — "Red Planet Groove" is a funk band; Mars,
  retro-space, 70s poster typography, warm and characterful, but still a tool
  and not a poster.
- One that is **card- and list-led** rather than grid-led — questioning whether
  a traditional month grid is even the right primitive on a phone, e.g. a
  scrolling run of weeks or an agenda-style list.

Take the third one seriously; it may well be the right answer on mobile.

## Deliverables per approach

- The four screens above, mobile, plus desktop for the calendar screens.
- The full heat scale (0 through 6 available) rendered as an explicit legend.
- Color and type tokens listed as text so they can be lifted into Tailwind.
- One line on who the approach is for and what it trades away.
