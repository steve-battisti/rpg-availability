/**
 * "Best gig dates" and "best practice dates" over the next six months.
 *
 * This is the screen someone reads aloud while a bar owner waits on the phone,
 * so the ranking is deliberately boring and predictable: highest score first,
 * soonest date to break a tie. Nothing else reorders the list.
 *
 * In particular, `unknownCount` is *reported* but never used to sort. A date
 * where half the band has not answered should be visibly flagged in the UI, not
 * quietly demoted — the band, not the algorithm, decides whether three yeses and
 * three silences is worth a phone call.
 */

import { type DayTally, type Member, tallyDay } from './availability';
import type { AvailabilityIndex } from './availability';
import { type Day, dayRange } from './day';

/** Six months, counted in days so the horizon is a fixed, testable length. */
export const HORIZON_DAYS = 180;

/** How many dates each list surfaces by default. */
export const DEFAULT_LIMIT = 10;

export interface RankOptions {
  roster: readonly Member[];
  index: AvailabilityIndex;
  /**
   * The first date considered, inclusive. Injected rather than read from the
   * clock so ranking is a pure function and tests need not freeze time.
   */
  today: Day;
  horizonDays?: number;
  limit?: number;
}

export interface BestDates {
  /** Fri/Sat/Sun, best first. */
  gig: DayTally[];
  /** Mon–Thu, best first. */
  practice: DayTally[];
  horizon: { start: Day; end: Day; days: number };
}

/**
 * Order two tallies for display: higher score first, then the sooner date.
 *
 * Day strings are `YYYY-MM-DD`, so lexicographic comparison is chronological
 * comparison — no parsing needed to sort them.
 */
function byScoreThenDate(a: DayTally, b: DayTally): number {
  if (a.score !== b.score) return b.score - a.score;
  return a.day < b.day ? -1 : a.day > b.day ? 1 : 0;
}

/**
 * Rank upcoming dates for gigs and practices.
 *
 * Dates scoring zero are excluded: a night on which nobody has said yes is not
 * a candidate, and padding the list with them would make an empty calendar look
 * like it had answers.
 */
export function rankBestDates(options: RankOptions): BestDates {
  const {
    roster,
    index,
    today,
    horizonDays = HORIZON_DAYS,
    limit = DEFAULT_LIMIT,
  } = options;

  const days = dayRange(today, horizonDays);
  const horizon = {
    start: today,
    end: days.length > 0 ? (days[days.length - 1] as Day) : today,
    days: days.length,
  };

  if (limit <= 0) return { gig: [], practice: [], horizon };

  const gig: DayTally[] = [];
  const practice: DayTally[] = [];

  for (const day of days) {
    const t = tallyDay(day, roster, index);
    if (t.score <= 0) continue;
    (t.kind === 'gig' ? gig : practice).push(t);
  }

  gig.sort(byScoreThenDate);
  practice.sort(byScoreThenDate);

  return { gig: gig.slice(0, limit), practice: practice.slice(0, limit), horizon };
}
