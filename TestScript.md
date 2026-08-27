# Human test script

Cases that need a person and a real phone. Mechanical checks live in the test
suite (`npm test`) and the live-project check (`npm run verify:supabase`); do not
duplicate them here.

Prefer "find a date where X is true" over pinning a specific date — the calendar
moves, and a script naming 17 October rots the moment October passes.

---

## T1 — First run on a phone

1. Open the app on a phone you have never used it on.
2. **Expect:** the Entry screen, with the wordmark, four code boxes and six name
   pills.
3. Tap the code boxes. **Expect:** a numeric keypad, not a full keyboard.
4. Tap a name *without* entering the code. **Expect:** "Enter the mission code
   first." — and you stay on Entry.
5. Enter a wrong code, tap your name. **Expect:** "That code isn't right." and
   the boxes clear.
6. Enter the real code, tap your name. **Expect:** you land on Mark Availability,
   and the footer reads "Signed in as *you*".
7. Close the browser completely, reopen the app. **Expect:** straight to the
   calendar, no code, no name picker.

## T2 — Marking a month one-handed

1. On Mark Availability, hold the phone in one hand and thumb through a month.
2. Tap an empty date four times. **Expect:** ✓ → ? → × → empty, and it stays put
   between taps (no lag, no double-fire).
3. **Expect:** every date you can reach comfortably with a thumb. If the top row
   needs a second hand, that is a finding — write it down.
4. Navigate a month forward and back. **Expect:** your marks are still there.

## T3 — Bulk marking

1. Tap "Select multiple", then tap five dates. **Expect:** each shows a selection
   outline; the counter reads "5 selected"; none of them change status.
2. Tap ✓. **Expect:** all five turn available at once and the screen leaves bulk
   mode.
3. Tap "Mark rest of month free" on the **current** month.
   **Expect:** every unset date from *today* forward turns ✓, and dates earlier
   in the month are untouched. This is the one most likely to regress.
4. **Expect:** dates you had already marked keep what you gave them.

## T4 — Two phones at once

Needs two people, or two devices.

1. Sign in as different members on each device. Open Availability Report on one.
2. On the other, mark a date.
3. **Expect:** the report on the first device updates within a few seconds
   without a reload.

## T5 — The report tells the truth about silence

1. Find a date where some of the band has answered and some has not.
2. **Expect:** the cell is hatched and carries a small "+n" in the corner.
3. Find a date where everyone has answered. **Expect:** no hatch, no "+n".
4. Tap a date. **Expect:** all six names listed — the silent ones present and
   plainly blank, not shown as unavailable.
5. **Expect:** "*n* of 6 haven't answered for this date" below the list.

## T6 — Best Dates, read aloud

1. Open Best Dates. Hold the phone at arm's length.
2. **Expect:** you can read a date and its score without leaning in. This screen
   is used mid-phone-call with a bar; if you have to squint, that is a finding.
3. **Expect:** gigs are only Fri/Sat/Sun, practices only Mon–Thu.
4. **Expect:** each card says either "*n* haven't answered" or "everyone
   answered".

## T7 — Permissions

1. Sign in as someone who is **not** Steve.
2. **Expect:** no "Editing" switcher on Mark Availability — only your own
   calendar exists to you.
3. Sign in as Steve. **Expect:** an "Editing" row listing Me, Katie, Mike, Fran,
   Rob, JT.
4. Tap another member. **Expect:** a warning that you are editing their calendar,
   not your own, and marks you make land on theirs.

## T8 — Both themes, and the colourblind check

1. Toggle light/dark. **Expect:** no layout shift, only colour.
2. **Ask someone red/green colourblind, or use a phone's colourblind simulation:**
   can you still tell a busy date from a free one, and a 5-of-6 date from a
   2-of-6 date? The glyphs (✓ × ?), the numerals and the hatch are supposed to
   carry it without the colour. If they cannot, that is the most important bug in
   the app.

## T9 — Bad network

1. Turn on airplane mode. Tap a date.
2. **Expect:** the cell changes immediately, then reverts, and an error banner
   appears. It must not silently pretend the change saved.
