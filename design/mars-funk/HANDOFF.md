# Handoff — Option 1b, "Mars Funk"

Chosen direction (2026-08-27). Drop the design output in this folder. Until it
lands, no UI code gets written — the app shell, the Tailwind theme and the
component structure all follow from what is below.

## What I need, in rough priority order

- [ ] **Design tokens as text.** The brief asked for these explicitly, so they
      should already exist. Colors for **light and dark**, the type stack and
      scale, radii, spacing, shadows. Paste them into `tokens.md` here, or drop
      the raw CSS/Tailwind block — either is fine, I do not need it tidied.
- [ ] **The heat scale, all seven levels** (0 through 6 available) with each
      level's **non-color cue** — the numeral, pips, pattern or weight that
      carries the signal for a red/green colorblind reader.
- [ ] **The four cell states** — Available, Unavailable, Maybe, and unset — and
      specifically how *unset* is kept calm and distinct from *unavailable*.
- [ ] **The bulk-marking interaction it chose** — drag across days, tap a week
      row, "rest of month", something else. This one shapes the calendar
      component's event handling more than anything else on the list, so a
      sentence describing it is worth more than a picture of it.
- [ ] **Screens.** Screenshots or PNG exports of the four artboards at mobile,
      plus the two calendar screens at desktop. Name them loosely
      (`report-mobile.png` etc.); I will sort them out.
- [ ] **Exported HTML/CSS**, if Claude Design offers it. Not required — I would
      rebuild it in React and Tailwind regardless — but it settles spacing and
      type questions faster than reading them off an image.

## Also useful, if it is easy

- The Claude Design share link, so I can go back for detail rather than asking.
- The one-line "who it is for and what it trades away" note for 1b.
- Anything you disliked in 1b and want changed on the way in. Cheaper to hear
  now than after it is built.
