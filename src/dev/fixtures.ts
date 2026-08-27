/**
 * Deterministic fixture data for the design preview.
 *
 * No randomness: the preview has to produce the same picture on every run, or
 * comparing it against design/mars-funk/screenshots/ proves nothing.
 *
 * The shape is deliberately awkward rather than tidy — someone on tour, someone
 * who only marks weekends, someone who has never opened the app — because a
 * calendar where everybody answered is the one case that cannot show whether
 * "unknown" is being rendered correctly.
 */

import type { Mark, Status } from '../lib/availability';
import { type Day, dayRange, isGigDay } from '../lib/day';

const AVAILABLE: Status = 'available';
const UNAVAILABLE: Status = 'unavailable';
const MAYBE: Status = 'maybe';

export function fixtureMarks(today: Day, days = 200): Mark[] {
  const marks: Mark[] = [];
  for (const [i, day] of dayRange(today, days).entries()) {
    // Steve marks everything, with the odd night out.
    marks.push({ memberId: 'steve', day, status: i % 11 === 0 ? UNAVAILABLE : AVAILABLE });

    // Katie only bothers with weekends.
    if (isGigDay(day)) {
      marks.push({ memberId: 'katie', day, status: i % 7 === 0 ? MAYBE : AVAILABLE });
    }

    // Mike is on tour for the first five weeks.
    marks.push({ memberId: 'mike', day, status: i < 35 ? UNAVAILABLE : AVAILABLE });

    // Fran hedges.
    if (i % 3 === 0) marks.push({ memberId: 'fran', day, status: MAYBE });

    // Rob is patchy.
    if (i % 5 === 0) marks.push({ memberId: 'rob', day, status: AVAILABLE });

    // JT has never opened the app. That is the point of JT.
  }
  return marks;
}
