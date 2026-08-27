import { describe, expect, it } from 'vitest';
import {
  InvalidDayError,
  addDays,
  dayKind,
  dayRange,
  daysBetween,
  isGigDay,
  isPracticeDay,
  isValidDay,
  utcMsToDay,
  weekday,
} from './day';

describe('validation', () => {
  it('accepts a real date', () => {
    expect(isValidDay('2026-08-27')).toBe(true);
  });

  it.each([
    ['2026-8-27', 'unpadded month'],
    ['26-08-27', 'two-digit year'],
    ['2026/08/27', 'wrong separator'],
    ['2026-08-27T00:00:00Z', 'carries a time'],
    ['', 'empty'],
    ['tomorrow', 'not a date at all'],
  ])('rejects %s (%s)', (value) => {
    expect(isValidDay(value)).toBe(false);
  });

  it('rejects dates that do not exist rather than rolling them forward', () => {
    // The trap: Date.UTC(2026, 1, 30) silently yields March 2nd.
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2025-02-29')).toBe(false);
    expect(isValidDay('2026-13-01')).toBe(false);
    expect(isValidDay('2026-04-31')).toBe(false);
  });

  it('accepts a real leap day', () => {
    expect(isValidDay('2028-02-29')).toBe(true);
  });

  it('throws a named error so callers can distinguish it', () => {
    expect(() => addDays('nonsense', 1)).toThrow(InvalidDayError);
  });
});

describe('arithmetic', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-08-27', 3)).toBe('2026-08-30');
  });

  it('rolls across a month boundary', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('rolls across a year boundary', () => {
    expect(addDays('2026-12-30', 5)).toBe('2027-01-04');
  });

  it('subtracts with a negative count', () => {
    expect(addDays('2026-01-02', -3)).toBe('2025-12-30');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('skips the absent leap day in a common year', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('measures the gap between two days', () => {
    expect(daysBetween('2026-08-27', '2026-09-03')).toBe(7);
    expect(daysBetween('2026-09-03', '2026-08-27')).toBe(-7);
    expect(daysBetween('2026-08-27', '2026-08-27')).toBe(0);
  });

  it('crosses a DST boundary without gaining or losing a day', () => {
    // US DST ends 2026-11-01. Local-time date math would produce a 25-hour day
    // here and can land on the wrong date; UTC arithmetic cannot.
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    // ...and the spring-forward boundary, 2026-03-08.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });

  it('round-trips through epoch milliseconds', () => {
    expect(utcMsToDay(0)).toBe('1970-01-01');
  });
});

describe('weekday and kind', () => {
  // 2026-08-27 is a Thursday. Anchor everything to it.
  it.each([
    ['2026-08-23', 0, 'Sunday'],
    ['2026-08-24', 1, 'Monday'],
    ['2026-08-25', 2, 'Tuesday'],
    ['2026-08-26', 3, 'Wednesday'],
    ['2026-08-27', 4, 'Thursday'],
    ['2026-08-28', 5, 'Friday'],
    ['2026-08-29', 6, 'Saturday'],
  ])('%s is weekday %i (%s)', (day, expected) => {
    expect(weekday(day)).toBe(expected);
  });

  it('treats Fri, Sat and Sun as gig days', () => {
    expect(['2026-08-28', '2026-08-29', '2026-08-30'].map(isGigDay)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('treats Mon through Thu as practice days', () => {
    expect(
      ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27'].map(isPracticeDay),
    ).toEqual([true, true, true, true]);
  });

  it('puts every day in exactly one bucket', () => {
    for (const day of dayRange('2026-08-23', 28)) {
      expect(isGigDay(day)).toBe(!isPracticeDay(day));
      expect(dayKind(day)).toBe(isGigDay(day) ? 'gig' : 'practice');
    }
  });

  it('splits a full week 3 gig / 4 practice', () => {
    const week = dayRange('2026-08-23', 7);
    expect(week.filter(isGigDay)).toHaveLength(3);
    expect(week.filter(isPracticeDay)).toHaveLength(4);
  });
});

describe('dayRange', () => {
  it('is inclusive of the start and returns exactly count days', () => {
    expect(dayRange('2026-08-27', 3)).toEqual([
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
    ]);
  });

  it('returns nothing for a non-positive count', () => {
    expect(dayRange('2026-08-27', 0)).toEqual([]);
    expect(dayRange('2026-08-27', -5)).toEqual([]);
  });

  it('still validates the start when producing nothing', () => {
    expect(() => dayRange('2026-02-30', 0)).toThrow(InvalidDayError);
  });

  it('spans a six-month horizon without drift', () => {
    const range = dayRange('2026-08-27', 180);
    expect(range).toHaveLength(180);
    expect(range[0]).toBe('2026-08-27');
    expect(range[179]).toBe('2027-02-22');
    expect(new Set(range).size).toBe(180);
  });
});
