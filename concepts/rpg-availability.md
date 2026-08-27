# Concept: Red Planet Groove Availability

Requirements of record. Update this file when scope changes; plans reference it.

## Who
Six band members, known to each other. No public signup, no email verification.

| # | Name | Role |
|---|---|---|
| 1 | Steve | **administrator** |
| 2 | Katie | member |
| 3 | Mike | member |
| 4 | Fran | member |
| 5 | Rob | member |
| 6 | JT | member |

The roster is fixed and seeded, not self-service. Adding or removing a member is
a migration, not a feature — revisit only if the lineup actually changes.

## R1 — Identity
- On first visit a user enters their name; it is persisted locally (cookie /
  localStorage) so returning users skip the prompt.
- Name is chosen from the known band roster rather than free text, so two
  spellings of the same person cannot fork one member's calendar.
- Access is gated by a single shared **band passcode**, entered once. After the
  passcode, the user picks their name; the browser receives a durable anonymous
  session that claims that member row. A new device re-enters the passcode.
- Admin is a flag on a member row, not a separate login.

## R2 — Mark Availability (primary screen)
- Calendar view, month at a time.
- Each date is one of: **Available**, **Unavailable**, **Maybe**, or **unset**.
- **Unset means "no answer" — it does NOT count as available.** A date only
  counts toward the report and the rankings once a member has actually marked it.
- Because unset is the default and does not count, marking must support a fast
  path over a run of dates (drag, week row, "rest of month"). Tapping 180 cells
  is not an acceptable cost of entry.
- Users may change any of their own dates at any time.
- Mobile-first: a month grid must be tappable one-handed on a phone.

## R3 — Permissions
- A user may only edit their own availability.
- The administrator may edit anyone's availability.

## R4 — Availability Report (secondary screen)
- Availability by date, aggregated across all members.
- Colour coded by how many members are missing:
  solid green = everyone available; lighter greens = 1 missing, 2 missing, …
- Tapping/selecting a date reveals **who** is missing and who is a Maybe.

## R5 — Best dates callout
- Highlighted section surfacing, over the next six months:
  - **Best gig dates** — Fri / Sat / Sun only.
  - **Best practice dates** — Mon–Thu only.
- Ranked by score = (count of Available) + 0.5 x (count of Maybe); ties broken
  by soonest date. Unset members contribute 0 and are reported as unknown.
- No member is required. A date is never disqualified by *who* is missing, only
  ranked by how many. (Revisit if this proves wrong in practice.)
- Each suggested date must show how many of the six have not answered yet, so
  nobody pitches a date to a bar on the strength of two responses.
- Purpose: someone on the phone with a bar can name dates immediately.

## R6 — Scope guards
- Personal use, 6 people. No custom domain, no app-title clearance needed.
- Not in scope (unless later asked): notifications, gig/setlist management,
  recurring-availability rules, multiple bands.

## R7 — Platform
- Web app, mobile-responsive. Cloudflare Pages hosting is acceptable.
