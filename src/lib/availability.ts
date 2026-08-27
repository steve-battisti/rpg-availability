/**
 * Roster, marks, and per-day tallies.
 *
 * The central rule of this module: **an unmarked date is "unknown", not
 * "available"**. A member who has never opened the app contributes nothing to a
 * date's score and is reported by name as silent. A date with 3 yes / 3 unknown
 * must never be presentable as though it were 3 yes / 3 no, because the first
 * might still become a gig and the second cannot.
 */

import { type Day, type DayKind, dayKind } from './day';

export type MemberId = string;

export interface Member {
  id: MemberId;
  /** Display name as the band writes it — "JT", not "J.T.". */
  name: string;
  isAdmin: boolean;
}

/** What a member has said about a date. Absence of a mark is not a status. */
export type Status = 'available' | 'unavailable' | 'maybe';

export interface Mark {
  memberId: MemberId;
  day: Day;
  status: Status;
}

/**
 * A Maybe is worth half a firm yes when ranking dates.
 *
 * 0.5 is exactly representable in binary floating point, so scores over a
 * six-person roster are exact and compare cleanly. Do not change this to a
 * value like 0.3 without switching scores to integer half-points.
 */
export const MAYBE_WEIGHT = 0.5;

/** Marks indexed for O(1) lookup by day then member. */
export type AvailabilityIndex = ReadonlyMap<Day, ReadonlyMap<MemberId, Status>>;

/**
 * Build a lookup index from a flat list of marks.
 *
 * A later mark for the same (day, member) wins, so callers can feed an
 * append-ordered changelog without deduplicating first.
 */
export function indexMarks(marks: readonly Mark[]): AvailabilityIndex {
  const index = new Map<Day, Map<MemberId, Status>>();
  for (const mark of marks) {
    let forDay = index.get(mark.day);
    if (!forDay) {
      forDay = new Map<MemberId, Status>();
      index.set(mark.day, forDay);
    }
    forDay.set(mark.memberId, mark.status);
  }
  return index;
}

/** What a member said about a day, or `undefined` if they have not answered. */
export function statusOf(
  index: AvailabilityIndex,
  day: Day,
  memberId: MemberId,
): Status | undefined {
  return index.get(day)?.get(memberId);
}

/**
 * One date, resolved against the whole roster.
 *
 * The four member lists always partition the roster exactly — every member
 * appears in exactly one of them.
 */
export interface DayTally {
  day: Day;
  kind: DayKind;
  available: MemberId[];
  unavailable: MemberId[];
  maybe: MemberId[];
  /** Members who have not answered. Never merged into `unavailable`. */
  unknown: MemberId[];
  /** `available.length + MAYBE_WEIGHT * maybe.length`. */
  score: number;
  /** How many members have expressed any opinion at all. */
  answeredCount: number;
  /** Convenience mirror of `unknown.length`, for sorting and display. */
  unknownCount: number;
}

/** Resolve a single date against the roster. */
export function tallyDay(
  day: Day,
  roster: readonly Member[],
  index: AvailabilityIndex,
): DayTally {
  const available: MemberId[] = [];
  const unavailable: MemberId[] = [];
  const maybe: MemberId[] = [];
  const unknown: MemberId[] = [];

  for (const member of roster) {
    switch (statusOf(index, day, member.id)) {
      case 'available':
        available.push(member.id);
        break;
      case 'unavailable':
        unavailable.push(member.id);
        break;
      case 'maybe':
        maybe.push(member.id);
        break;
      default:
        unknown.push(member.id);
    }
  }

  return {
    day,
    kind: dayKind(day),
    available,
    unavailable,
    maybe,
    unknown,
    score: available.length + MAYBE_WEIGHT * maybe.length,
    answeredCount: roster.length - unknown.length,
    unknownCount: unknown.length,
  };
}

/** Resolve a run of dates. Order is preserved. */
export function tallyRange(
  days: readonly Day[],
  roster: readonly Member[],
  index: AvailabilityIndex,
): DayTally[] {
  return days.map((day) => tallyDay(day, roster, index));
}

/** Map ids back to display names, in roster order, for the UI. */
export function namesOf(ids: readonly MemberId[], roster: readonly Member[]): string[] {
  const wanted = new Set(ids);
  return roster.filter((m) => wanted.has(m.id)).map((m) => m.name);
}
