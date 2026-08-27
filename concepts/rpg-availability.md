# Concept: Red Planet Groove Availability

Requirements of record. Update this file when scope changes; plans reference it.

## Who
Six band members, known to each other. No public signup, no email verification.
One of them is the administrator (Steve).

## R1 — Identity
- On first visit a user enters their name; it is persisted locally (cookie /
  localStorage) so returning users skip the prompt.
- Name is chosen from the known band roster rather than free text, so two
  spellings of the same person cannot fork one member's calendar.
- Admin has an extra capability (see R3). How admin is proven: **open question**.

## R2 — Mark Availability (primary screen)
- Calendar view, month at a time.
- Each date is one of: **Available**, **Unavailable**, **Maybe**, or unset.
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
- Ranked by how many members are available; ties broken by soonest date.
- Purpose: someone on the phone with a bar can name dates immediately.

## R6 — Scope guards
- Personal use, 6 people. No custom domain, no app-title clearance needed.
- Not in scope (unless later asked): notifications, gig/setlist management,
  recurring-availability rules, multiple bands.

## R7 — Platform
- Web app, mobile-responsive. Cloudflare Pages hosting is acceptable.
