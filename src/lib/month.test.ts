import { describe, expect, it } from 'vitest';
import { today } from './clock';
import { isValidDay } from './day';
import {
  clampToMonth,
  dayNumber,
  daysInMonth,
  firstOfMonth,
  lastOfMonth,
  longDateLabel,
  monthDays,
  monthGrid,
  monthLabel,
  monthOf,
  relativeWeekLabel,
  sameMonth,
  shiftMonth,
  shortDateLabel,
} from './month';

const OCT_2026 = { year: 2026, month: 10 };

describe('today', () => {
  it('reads the local calendar date, not UTC', () => {
    // 11pm local on the 27th is still the 27th, whatever UTC thinks.
    const late = new Date(2026, 7, 27, 23, 30);
    expect(today(late)).toBe('2026-08-27');
  });

  it('pads single-digit months and days', () => {
    expect(today(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('produces a day the rest of the domain accepts', () => {
    expect(isValidDay(today())).toBe(true);
  });
});

describe('month arithmetic', () => {
  it('finds the month a day belongs to', () => {
    expect(monthOf('2026-10-17')).toEqual(OCT_2026);
  });

  it('knows the first and last of a month', () => {
    expect(firstOfMonth(OCT_2026)).toBe('2026-10-01');
    expect(lastOfMonth(OCT_2026)).toBe('2026-10-31');
  });

  it('counts days including February in a leap year', () => {
    expect(daysInMonth(OCT_2026)).toBe(31);
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
    expect(daysInMonth({ year: 2028, month: 2 })).toBe(29);
    expect(daysInMonth({ year: 2026, month: 4 })).toBe(30);
  });

  it('rolls the year when stepping past December', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('steps many months at once without drifting', () => {
    expect(shiftMonth(OCT_2026, 6)).toEqual({ year: 2027, month: 4 });
    expect(shiftMonth(OCT_2026, -10)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(shiftMonth(OCT_2026, 7), -7)).toEqual(OCT_2026);
  });

  it('compares months', () => {
    expect(sameMonth(OCT_2026, { year: 2026, month: 10 })).toBe(true);
    expect(sameMonth(OCT_2026, { year: 2025, month: 10 })).toBe(false);
  });
});

describe('monthGrid', () => {
  const grid = monthGrid(OCT_2026);

  it('is a whole number of seven-day weeks', () => {
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it('pads the lead with nulls so the 1st lands on its real weekday', () => {
    // 2026-10-01 is a Thursday, so four blanks precede it.
    expect(grid[0]?.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[0]?.[4]).toBe('2026-10-01');
  });

  it('pads the tail with nulls rather than dates from November', () => {
    const lastWeek = grid[grid.length - 1]!;
    const realDays = lastWeek.filter((d): d is string => d !== null);
    expect(realDays[realDays.length - 1]).toBe('2026-10-31');
    expect(lastWeek.slice(realDays.length + lastWeek.indexOf(realDays[0]!))).toEqual(
      Array(lastWeek.length - realDays.length).fill(null),
    );
  });

  it('contains every day of the month exactly once and nothing else', () => {
    const flat = grid.flat().filter((d): d is string => d !== null);
    expect(flat).toEqual(monthDays(OCT_2026));
    expect(new Set(flat).size).toBe(31);
  });

  it('handles a month starting on Sunday with no leading blanks', () => {
    // 2026-11-01 is a Sunday.
    const nov = monthGrid({ year: 2026, month: 11 });
    expect(nov[0]?.[0]).toBe('2026-11-01');
  });

  it('handles February in a leap year', () => {
    const feb = monthGrid({ year: 2028, month: 2 });
    const flat = feb.flat().filter(Boolean);
    expect(flat).toHaveLength(29);
    expect(flat[28]).toBe('2028-02-29');
  });

  it('produces a grid for every month of a year without throwing', () => {
    for (let month = 1; month <= 12; month++) {
      const g = monthGrid({ year: 2026, month });
      expect(g.flat().filter(Boolean)).toHaveLength(daysInMonth({ year: 2026, month }));
    }
  });
});

describe('labels', () => {
  it('renders the month nav label', () => {
    expect(monthLabel(OCT_2026)).toBe('OCT 2026');
  });

  it('renders the report title', () => {
    expect(longDateLabel('2026-10-17')).toBe('Saturday, October 17');
  });

  it('renders the Best Dates headline', () => {
    expect(shortDateLabel('2026-10-23')).toBe('FRI OCT 23');
  });

  it('reads the day number off a date', () => {
    expect(dayNumber('2026-10-01')).toBe(1);
    expect(dayNumber('2026-10-31')).toBe(31);
  });
});

describe('relativeWeekLabel', () => {
  // 2026-08-27 is a Thursday; its calendar week runs Sun 23rd – Sat 29th.
  const TODAY = '2026-08-27';

  it('calls the current calendar week "This week"', () => {
    expect(relativeWeekLabel('2026-08-29', TODAY)).toBe('This week');
    expect(relativeWeekLabel('2026-08-23', TODAY)).toBe('This week');
  });

  it('calls the following calendar week "Next week"', () => {
    expect(relativeWeekLabel('2026-08-30', TODAY)).toBe('Next week');
    expect(relativeWeekLabel('2026-09-05', TODAY)).toBe('Next week');
  });

  it('names the month for anything further out', () => {
    expect(relativeWeekLabel('2026-10-23', TODAY)).toBe('October');
  });

  it('uses calendar weeks, not rolling seven-day windows', () => {
    // Sunday the 30th is 3 days away but belongs to next week, and Saturday the
    // 29th is 2 days away and belongs to this one. A rolling window would call
    // both "this week", which is not what someone booking a gig means.
    expect(relativeWeekLabel('2026-08-29', TODAY)).toBe('This week');
    expect(relativeWeekLabel('2026-08-30', TODAY)).toBe('Next week');
  });
});

describe('clampToMonth', () => {
  it('leaves a date already inside the month alone', () => {
    expect(clampToMonth('2026-10-17', OCT_2026)).toBe('2026-10-17');
  });

  it('pulls an earlier date up to the first', () => {
    expect(clampToMonth('2026-09-30', OCT_2026)).toBe('2026-10-01');
  });

  it('pulls a later date back to the last', () => {
    expect(clampToMonth('2026-11-01', OCT_2026)).toBe('2026-10-31');
  });
});
