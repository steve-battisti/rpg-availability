import { describe, expect, it } from 'vitest';
import { type Mark, indexMarks } from './availability';
import { DEFAULT_LIMIT, HORIZON_DAYS, rankBestDates } from './bestDates';
import { addDays, dayRange, isGigDay, isPracticeDay } from './day';
import { ROSTER } from './roster';

/** 2026-08-27 is a Thursday. Every fixture is anchored to it. */
const TODAY = '2026-08-27';

const ids = ROSTER.map((m) => m.id);

function rank(marks: Mark[], overrides: Partial<Parameters<typeof rankBestDates>[0]> = {}) {
  return rankBestDates({
    roster: ROSTER,
    index: indexMarks(marks),
    today: TODAY,
    ...overrides,
  });
}

/** Every member says the same thing about a day. */
function everyone(day: string, status: Mark['status']): Mark[] {
  return ids.map((memberId) => ({ memberId, day, status }));
}

/** The first `n` members say `status`; the rest stay silent. */
function some(day: string, n: number, status: Mark['status']): Mark[] {
  return ids.slice(0, n).map((memberId) => ({ memberId, day, status }));
}

describe('horizon', () => {
  it('covers 180 days starting today', () => {
    const { horizon } = rank([]);
    expect(horizon.days).toBe(HORIZON_DAYS);
    expect(horizon.start).toBe(TODAY);
    expect(horizon.end).toBe(addDays(TODAY, HORIZON_DAYS - 1));
  });

  it('includes today itself', () => {
    // 2026-08-27 is a Thursday, so it lands in the practice list.
    const { practice } = rank(everyone(TODAY, 'available'));
    expect(practice[0]?.day).toBe(TODAY);
  });

  it('excludes yesterday', () => {
    const yesterday = addDays(TODAY, -1);
    const { gig, practice } = rank(everyone(yesterday, 'available'));
    expect([...gig, ...practice]).toEqual([]);
  });

  it('excludes the day after the horizon ends', () => {
    const justPast = addDays(TODAY, HORIZON_DAYS);
    const { gig, practice } = rank(everyone(justPast, 'available'));
    expect([...gig, ...practice]).toEqual([]);
  });

  it('includes the final day of the horizon', () => {
    const last = addDays(TODAY, HORIZON_DAYS - 1);
    const { gig, practice } = rank(everyone(last, 'available'));
    expect([...gig, ...practice].map((t) => t.day)).toEqual([last]);
  });

  it('honours a custom horizon', () => {
    const { horizon } = rank([], { horizonDays: 30 });
    expect(horizon.days).toBe(30);
    expect(horizon.end).toBe(addDays(TODAY, 29));
  });
});

describe('bucketing', () => {
  it('puts only Fri/Sat/Sun in the gig list', () => {
    const marks = dayRange(TODAY, 21).flatMap((d) => everyone(d, 'available'));
    const { gig } = rank(marks, { limit: 100 });
    expect(gig.length).toBeGreaterThan(0);
    expect(gig.every((t) => isGigDay(t.day))).toBe(true);
    expect(gig.every((t) => t.kind === 'gig')).toBe(true);
  });

  it('puts only Mon–Thu in the practice list', () => {
    const marks = dayRange(TODAY, 21).flatMap((d) => everyone(d, 'available'));
    const { practice } = rank(marks, { limit: 100 });
    expect(practice.length).toBeGreaterThan(0);
    expect(practice.every((t) => isPracticeDay(t.day))).toBe(true);
  });

  it('never lists the same date in both buckets', () => {
    const marks = dayRange(TODAY, 60).flatMap((d) => everyone(d, 'available'));
    const { gig, practice } = rank(marks, { limit: 100 });
    const overlap = new Set(gig.map((t) => t.day));
    expect(practice.some((t) => overlap.has(t.day))).toBe(false);
  });
});

describe('ranking', () => {
  it('orders by score, best first', () => {
    // Three Fridays with 6, 4 and 2 yeses respectively.
    const fri1 = '2026-08-28';
    const fri2 = '2026-09-04';
    const fri3 = '2026-09-11';
    const { gig } = rank([
      ...some(fri1, 2, 'available'),
      ...some(fri2, 6, 'available'),
      ...some(fri3, 4, 'available'),
    ]);
    expect(gig.map((t) => t.day)).toEqual([fri2, fri3, fri1]);
    expect(gig.map((t) => t.score)).toEqual([6, 4, 2]);
  });

  it('breaks a tie with the sooner date', () => {
    const early = '2026-08-28';
    const late = '2026-09-04';
    const { gig } = rank([
      ...some(late, 4, 'available'),
      ...some(early, 4, 'available'),
    ]);
    expect(gig.map((t) => t.day)).toEqual([early, late]);
  });

  it('ranks a maybe below a firm yes', () => {
    const withMaybe = '2026-08-28';
    const allFirm = '2026-09-04';
    const { gig } = rank([
      ...some(withMaybe, 3, 'available'),
      { memberId: 'fran', day: withMaybe, status: 'maybe' },
      ...some(allFirm, 4, 'available'),
    ]);
    expect(gig[0]?.day).toBe(allFirm);
    expect(gig[0]?.score).toBe(4);
    expect(gig[1]?.score).toBe(3.5);
  });

  it('does not demote a date for having unknowns', () => {
    // Same score, but the sooner date has three silent members. Spec says the
    // sooner date still wins; the UI is responsible for flagging the silence.
    const soonAndSilent = '2026-08-28';
    const laterAndAnswered = '2026-09-04';
    const { gig } = rank([
      ...some(soonAndSilent, 3, 'available'),
      ...some(laterAndAnswered, 3, 'available'),
      { memberId: 'fran', day: laterAndAnswered, status: 'unavailable' },
      { memberId: 'rob', day: laterAndAnswered, status: 'unavailable' },
      { memberId: 'jt', day: laterAndAnswered, status: 'unavailable' },
    ]);
    expect(gig[0]?.day).toBe(soonAndSilent);
    expect(gig[0]?.unknownCount).toBe(3);
    expect(gig[1]?.unknownCount).toBe(0);
    expect(gig[0]?.score).toBe(gig[1]?.score);
  });

  it('reports who is missing on each ranked date', () => {
    const fri = '2026-08-28';
    const { gig } = rank([
      ...some(fri, 4, 'available'),
      { memberId: 'rob', day: fri, status: 'unavailable' },
    ]);
    expect(gig[0]?.available).toEqual(['steve', 'katie', 'mike', 'fran']);
    expect(gig[0]?.unavailable).toEqual(['rob']);
    expect(gig[0]?.unknown).toEqual(['jt']);
  });
});

describe('exclusions', () => {
  it('returns nothing when nobody has marked anything', () => {
    const { gig, practice } = rank([]);
    expect(gig).toEqual([]);
    expect(practice).toEqual([]);
  });

  it('excludes a date nobody said yes to', () => {
    const { gig } = rank(everyone('2026-08-28', 'unavailable'));
    expect(gig).toEqual([]);
  });

  it('keeps a date carried only by maybes', () => {
    const { gig } = rank([{ memberId: 'steve', day: '2026-08-28', status: 'maybe' }]);
    expect(gig.map((t) => t.day)).toEqual(['2026-08-28']);
    expect(gig[0]?.score).toBe(0.5);
  });
});

describe('limits', () => {
  it('caps each list at ten by default', () => {
    const marks = dayRange(TODAY, HORIZON_DAYS).flatMap((d) => everyone(d, 'available'));
    const { gig, practice } = rank(marks);
    expect(gig).toHaveLength(DEFAULT_LIMIT);
    expect(practice).toHaveLength(DEFAULT_LIMIT);
  });

  it('honours a custom limit', () => {
    const marks = dayRange(TODAY, 60).flatMap((d) => everyone(d, 'available'));
    expect(rank(marks, { limit: 3 }).gig).toHaveLength(3);
  });

  it('returns empty lists for a non-positive limit', () => {
    const marks = dayRange(TODAY, 60).flatMap((d) => everyone(d, 'available'));
    const { gig, practice } = rank(marks, { limit: 0 });
    expect(gig).toEqual([]);
    expect(practice).toEqual([]);
  });

  it('keeps the best dates when it truncates, not the first ones found', () => {
    // A weak Friday early on, strong Fridays later. With limit 1 the strong one
    // must survive — proof that sorting precedes slicing.
    const { gig } = rank(
      [...some('2026-08-28', 1, 'available'), ...some('2026-10-02', 6, 'available')],
      { limit: 1 },
    );
    expect(gig.map((t) => t.day)).toEqual(['2026-10-02']);
  });
});

describe('purity', () => {
  it('is a function of its arguments — same input, same output', () => {
    const marks = dayRange(TODAY, 90).flatMap((d) => some(d, 4, 'available'));
    expect(rank(marks)).toEqual(rank(marks));
  });

  it('shifts its window when today shifts, without touching the clock', () => {
    const fri = '2026-08-28';
    const marks = everyone(fri, 'available');
    expect(rank(marks).gig.map((t) => t.day)).toEqual([fri]);
    expect(rank(marks, { today: addDays(fri, 1) }).gig).toEqual([]);
  });
});
