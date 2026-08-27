/**
 * Month grids and date labels for the calendar screens.
 *
 * All pure, all driven by day strings. The grid is a plain array of weeks so a
 * component can map straight over it without doing arithmetic in JSX.
 */

import { type Day, addDays, dayToUtcMs, daysBetween, utcMsToDay, weekday } from './day';

export interface YearMonth {
  year: number;
  /** 1–12, not the zero-based month a `Date` uses. */
  month: number;
}

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const MONTH_NAMES_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** The design's weekday header: SU MO TU WE TH FR SA. */
export const WEEKDAY_HEADINGS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function monthOf(day: Day): YearMonth {
  const d = new Date(dayToUtcMs(day));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function firstOfMonth({ year, month }: YearMonth): Day {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

export function daysInMonth({ year, month }: YearMonth): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function lastOfMonth(ym: YearMonth): Day {
  return addDays(firstOfMonth(ym), daysInMonth(ym) - 1);
}

/** Step a month forward or back, rolling the year correctly. */
export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

export function sameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/**
 * The month as weeks of seven, Sunday first.
 *
 * Leading and trailing cells are `null` rather than dates from the neighbouring
 * months — the design draws them as empty, and a null cannot be tapped by
 * accident.
 */
export function monthGrid(ym: YearMonth): (Day | null)[][] {
  const first = firstOfMonth(ym);
  const total = daysInMonth(ym);
  const lead = weekday(first);

  const cells: (Day | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Every real date in the month, in order. */
export function monthDays(ym: YearMonth): Day[] {
  const first = firstOfMonth(ym);
  return Array.from({ length: daysInMonth(ym) }, (_, i) => addDays(first, i));
}

/** "OCT 2026" — the month-nav label. */
export function monthLabel({ year, month }: YearMonth): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "OCTOBER 2026" — the desktop header. */
export function monthLabelLong({ year, month }: YearMonth): string {
  return `${MONTH_NAMES_LONG[month - 1]?.toUpperCase()} ${year}`;
}

/** "Saturday, October 17" — the report's selected-date title. */
export function longDateLabel(day: Day): string {
  const d = new Date(dayToUtcMs(day));
  return `${WEEKDAY_NAMES_LONG[d.getUTCDay()]}, ${MONTH_NAMES_LONG[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "FRI OCT 23" — the Best Dates card headline. */
export function shortDateLabel(day: Day): string {
  const d = new Date(dayToUtcMs(day));
  const weekdayName = WEEKDAY_NAMES_LONG[d.getUTCDay()]?.slice(0, 3).toUpperCase();
  return `${weekdayName} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function dayNumber(day: Day): number {
  return new Date(dayToUtcMs(day)).getUTCDate();
}

/**
 * "This week" / "Next week" / "October" — the Best Dates sub-label.
 *
 * Weeks are calendar weeks starting Sunday, not rolling seven-day windows, so
 * "next week" means what someone booking a gig means by it.
 */
export function relativeWeekLabel(day: Day, todayDay: Day): string {
  const startOfThisWeek = addDays(todayDay, -weekday(todayDay));
  const weeksAway = Math.floor(daysBetween(startOfThisWeek, day) / 7);
  if (weeksAway === 0) return 'This week';
  if (weeksAway === 1) return 'Next week';
  const d = new Date(dayToUtcMs(day));
  return MONTH_NAMES_LONG[d.getUTCMonth()] ?? '';
}

/** Clamp a day into a month, used when the selected date survives month nav. */
export function clampToMonth(day: Day, ym: YearMonth): Day {
  const first = firstOfMonth(ym);
  const last = lastOfMonth(ym);
  if (day < first) return first;
  if (day > last) return last;
  return day;
}

/** Midpoint helper for tests and for defaulting the report's selected date. */
export function todayOrFirstOfMonth(ym: YearMonth, todayDay: Day): Day {
  return sameMonth(monthOf(todayDay), ym) ? todayDay : firstOfMonth(ym);
}

export { utcMsToDay };
