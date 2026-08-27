/**
 * Day-string primitives.
 *
 * A `Day` is a calendar date with no time and no timezone: the string
 * `YYYY-MM-DD`. This is the only date representation the domain uses.
 *
 * All arithmetic goes through `Date.UTC`, which is pure integer math against a
 * fixed epoch. We never construct a `Date` from local time, so a member in
 * Denver and a member in Dublin agree on what "October 3rd" means. Using a
 * local-time `Date` here is the classic way a calendar app ends up showing
 * someone the day before the one they tapped.
 */

/** A calendar date as `YYYY-MM-DD`. */
export type Day = string;

/** 0 = Sunday … 6 = Saturday, matching `Date.prototype.getUTCDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * What a date is a candidate for. Gigs are Fri/Sat/Sun, practices Mon–Thu;
 * every day of the week falls into exactly one of the two.
 */
export type DayKind = 'gig' | 'practice';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Thrown when a string is not a real calendar date. */
export class InvalidDayError extends Error {
  constructor(value: string) {
    super(`Invalid day "${value}": expected a real calendar date as YYYY-MM-DD`);
    this.name = 'InvalidDayError';
  }
}

/**
 * Convert a day string to milliseconds since the UTC epoch.
 *
 * Rejects strings that parse but do not round-trip — `2026-02-30` and
 * `2025-02-29` would otherwise silently roll forward into March.
 */
export function dayToUtcMs(day: Day): number {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new InvalidDayError(day);

  const [, y, m, d] = match as unknown as [string, string, string, string];
  const year = Number(y);
  const month = Number(m);
  const date = Number(d);

  const ms = Date.UTC(year, month - 1, date);
  const roundTrip = new Date(ms);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== date
  ) {
    throw new InvalidDayError(day);
  }
  return ms;
}

/** Convert milliseconds since the UTC epoch back to a day string. */
export function utcMsToDay(ms: number): Day {
  const d = new Date(ms);
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const date = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/** True if the string is a real calendar date in `YYYY-MM-DD` form. */
export function isValidDay(value: string): boolean {
  try {
    dayToUtcMs(value);
    return true;
  } catch {
    return false;
  }
}

/** Return the day `count` days after `day`. Negative counts move backwards. */
export function addDays(day: Day, count: number): Day {
  return utcMsToDay(dayToUtcMs(day) + count * MS_PER_DAY);
}

/** Whole days from `from` to `to`. Negative if `to` precedes `from`. */
export function daysBetween(from: Day, to: Day): number {
  return (dayToUtcMs(to) - dayToUtcMs(from)) / MS_PER_DAY;
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function weekday(day: Day): Weekday {
  return new Date(dayToUtcMs(day)).getUTCDay() as Weekday;
}

/**
 * `count` consecutive days starting at `start` (inclusive).
 * A non-positive count yields an empty range.
 */
export function dayRange(start: Day, count: number): Day[] {
  if (count <= 0) {
    dayToUtcMs(start); // validate even when producing nothing
    return [];
  }
  const startMs = dayToUtcMs(start);
  return Array.from({ length: count }, (_, i) => utcMsToDay(startMs + i * MS_PER_DAY));
}

/** Fri, Sat or Sun — the nights you can book a bar. */
export function isGigDay(day: Day): boolean {
  const w = weekday(day);
  return w === 5 || w === 6 || w === 0;
}

/** Mon–Thu — the nights you rehearse. */
export function isPracticeDay(day: Day): boolean {
  return !isGigDay(day);
}

/** Which of the two buckets a date belongs to. Every date belongs to one. */
export function dayKind(day: Day): DayKind {
  return isGigDay(day) ? 'gig' : 'practice';
}
