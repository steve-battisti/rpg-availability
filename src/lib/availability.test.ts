import { describe, expect, it } from 'vitest';
import {
  MAYBE_WEIGHT,
  type Mark,
  type Member,
  indexMarks,
  namesOf,
  statusOf,
  tallyDay,
  tallyRange,
} from './availability';
import { BAND_SIZE, ROSTER } from './roster';

const ids = ROSTER.map((m) => m.id);

function tally(day: string, marks: Mark[], roster: readonly Member[] = ROSTER) {
  return tallyDay(day, roster, indexMarks(marks));
}

function mark(memberId: string, day: string, status: Mark['status']): Mark {
  return { memberId, day, status };
}

describe('roster', () => {
  it('is the six-piece band with exactly one admin', () => {
    expect(BAND_SIZE).toBe(6);
    expect(ROSTER.map((m) => m.name)).toEqual([
      'Steve',
      'Katie',
      'Mike',
      'Fran',
      'Rob',
      'JT',
    ]);
    expect(ROSTER.filter((m) => m.isAdmin).map((m) => m.name)).toEqual(['Steve']);
  });

  it('has unique ids', () => {
    expect(new Set(ids).size).toBe(BAND_SIZE);
  });
});

describe('indexMarks', () => {
  it('reads back what was written', () => {
    const index = indexMarks([mark('steve', '2026-08-28', 'available')]);
    expect(statusOf(index, '2026-08-28', 'steve')).toBe('available');
  });

  it('returns undefined for an unmarked member, not a status', () => {
    const index = indexMarks([mark('steve', '2026-08-28', 'available')]);
    expect(statusOf(index, '2026-08-28', 'katie')).toBeUndefined();
    expect(statusOf(index, '2026-08-29', 'steve')).toBeUndefined();
  });

  it('lets a later mark overwrite an earlier one for the same day', () => {
    const index = indexMarks([
      mark('rob', '2026-08-28', 'available'),
      mark('rob', '2026-08-28', 'unavailable'),
    ]);
    expect(statusOf(index, '2026-08-28', 'rob')).toBe('unavailable');
  });

  it('keeps members and days independent', () => {
    const index = indexMarks([
      mark('rob', '2026-08-28', 'available'),
      mark('jt', '2026-08-28', 'maybe'),
      mark('rob', '2026-08-29', 'unavailable'),
    ]);
    expect(statusOf(index, '2026-08-28', 'rob')).toBe('available');
    expect(statusOf(index, '2026-08-28', 'jt')).toBe('maybe');
    expect(statusOf(index, '2026-08-29', 'rob')).toBe('unavailable');
    expect(statusOf(index, '2026-08-29', 'jt')).toBeUndefined();
  });
});

describe('tallyDay — the unknown rule', () => {
  it('reports an untouched date as six unknowns, not six available', () => {
    const t = tally('2026-08-28', []);
    expect(t.unknown).toEqual(ids);
    expect(t.available).toEqual([]);
    expect(t.unavailable).toEqual([]);
    expect(t.score).toBe(0);
    expect(t.answeredCount).toBe(0);
    expect(t.unknownCount).toBe(BAND_SIZE);
  });

  it('never merges unknown into unavailable', () => {
    const t = tally('2026-08-28', [mark('steve', '2026-08-28', 'unavailable')]);
    expect(t.unavailable).toEqual(['steve']);
    expect(t.unknown).toEqual(['katie', 'mike', 'fran', 'rob', 'jt']);
  });

  it('distinguishes 3-yes-3-unknown from 3-yes-3-no at equal score', () => {
    const threeYes = ['steve', 'katie', 'mike'] as const;
    const silent = tally(
      '2026-08-28',
      threeYes.map((id) => mark(id, '2026-08-28', 'available')),
    );
    const refused = tally('2026-08-28', [
      ...threeYes.map((id) => mark(id, '2026-08-28', 'available')),
      ...['fran', 'rob', 'jt'].map((id) => mark(id, '2026-08-28', 'unavailable')),
    ]);

    expect(silent.score).toBe(refused.score);
    expect(silent.unknownCount).toBe(3);
    expect(refused.unknownCount).toBe(0);
    expect(silent.answeredCount).toBe(3);
    expect(refused.answeredCount).toBe(6);
  });
});

describe('tallyDay — scoring', () => {
  it('scores a firm yes as one', () => {
    expect(tally('2026-08-28', [mark('steve', '2026-08-28', 'available')]).score).toBe(1);
  });

  it('scores a maybe as half', () => {
    expect(tally('2026-08-28', [mark('steve', '2026-08-28', 'maybe')]).score).toBe(
      MAYBE_WEIGHT,
    );
  });

  it('scores a no as zero', () => {
    expect(
      tally('2026-08-28', [mark('steve', '2026-08-28', 'unavailable')]).score,
    ).toBe(0);
  });

  it('sums yeses and maybes exactly, with no float drift', () => {
    const t = tally('2026-08-28', [
      mark('steve', '2026-08-28', 'available'),
      mark('katie', '2026-08-28', 'available'),
      mark('mike', '2026-08-28', 'maybe'),
      mark('fran', '2026-08-28', 'maybe'),
      mark('rob', '2026-08-28', 'maybe'),
      mark('jt', '2026-08-28', 'unavailable'),
    ]);
    expect(t.score).toBe(3.5);
    // Exactness matters: these are compared for equality when ranking.
    expect(t.score === 3.5).toBe(true);
  });

  it('tops out at the band size when everyone says yes', () => {
    const t = tally(
      '2026-08-28',
      ids.map((id) => mark(id, '2026-08-28', 'available')),
    );
    expect(t.score).toBe(BAND_SIZE);
    expect(t.unknownCount).toBe(0);
  });

  it('ignores marks belonging to a day other than the one being tallied', () => {
    const t = tally('2026-08-28', [mark('steve', '2026-08-29', 'available')]);
    expect(t.score).toBe(0);
    expect(t.unknownCount).toBe(BAND_SIZE);
  });

  it('ignores marks from someone no longer on the roster', () => {
    const t = tally('2026-08-28', [
      mark('steve', '2026-08-28', 'available'),
      mark('former-bass-player', '2026-08-28', 'available'),
    ]);
    expect(t.score).toBe(1);
    expect(t.available).toEqual(['steve']);
    expect(t.unknownCount).toBe(5);
  });
});

describe('tallyDay — invariants', () => {
  it('partitions the roster across the four buckets', () => {
    const t = tally('2026-08-28', [
      mark('steve', '2026-08-28', 'available'),
      mark('katie', '2026-08-28', 'unavailable'),
      mark('mike', '2026-08-28', 'maybe'),
    ]);
    const all = [...t.available, ...t.unavailable, ...t.maybe, ...t.unknown];
    expect(all).toHaveLength(BAND_SIZE);
    expect(new Set(all).size).toBe(BAND_SIZE);
    expect(t.answeredCount + t.unknownCount).toBe(BAND_SIZE);
  });

  it('lists members in roster order inside each bucket', () => {
    const t = tally(
      '2026-08-28',
      // Deliberately marked out of roster order.
      ['jt', 'katie', 'rob'].map((id) => mark(id, '2026-08-28', 'available')),
    );
    expect(t.available).toEqual(['katie', 'rob', 'jt']);
  });

  it('labels the date kind from its weekday', () => {
    expect(tally('2026-08-28', []).kind).toBe('gig'); // Friday
    expect(tally('2026-08-27', []).kind).toBe('practice'); // Thursday
  });

  it('tallies an empty roster without dividing by zero', () => {
    const t = tallyDay('2026-08-28', [], indexMarks([]));
    expect(t.score).toBe(0);
    expect(t.answeredCount).toBe(0);
    expect(t.unknownCount).toBe(0);
  });
});

describe('tallyRange', () => {
  it('preserves input order', () => {
    const days = ['2026-08-29', '2026-08-27', '2026-08-28'];
    expect(tallyRange(days, ROSTER, indexMarks([])).map((t) => t.day)).toEqual(days);
  });

  it('resolves each day against its own marks', () => {
    const index = indexMarks([
      mark('steve', '2026-08-28', 'available'),
      mark('katie', '2026-08-29', 'maybe'),
    ]);
    const [fri, sat] = tallyRange(['2026-08-28', '2026-08-29'], ROSTER, index);
    expect(fri?.score).toBe(1);
    expect(sat?.score).toBe(0.5);
  });
});

describe('namesOf', () => {
  it('returns display names in roster order regardless of input order', () => {
    expect(namesOf(['jt', 'steve', 'katie'], ROSTER)).toEqual(['Steve', 'Katie', 'JT']);
  });

  it('returns nothing for an empty list', () => {
    expect(namesOf([], ROSTER)).toEqual([]);
  });

  it('skips ids that are not on the roster', () => {
    expect(namesOf(['steve', 'ghost'], ROSTER)).toEqual(['Steve']);
  });
});
