/**
 * The app's single source of band data.
 *
 * Deliberately not TanStack Query, which the tech proposal originally called
 * for. Building it, the machinery did not earn its weight: this is two reads and
 * one write over six people's data. A hook with optimistic local application and
 * a realtime refetch is less code than wiring a QueryClient, and it keeps the
 * optimistic path visible in one place instead of hidden behind cache
 * invalidation rules.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AvailabilityIndex,
  type Mark,
  type Member,
  type MemberId,
  type Status,
  indexMarks,
} from '../lib/availability';
import { type Day, addDays } from '../lib/day';
import { HORIZON_DAYS } from '../lib/bestDates';
import { firstOfMonth, lastOfMonth, type YearMonth } from '../lib/month';
import { fetchMarks, setStatus as writeStatus, watchAvailability } from './availability';
import { currentMember, ensureSession, fetchRoster } from './session';

export interface BandData {
  roster: Member[];
  me: Member | null;
  index: AvailabilityIndex;
  loading: boolean;
  error: string | null;
  /** Re-read the current member after a successful claim. */
  refreshMe: () => Promise<void>;
  /** Optimistically set (or clear, with `null`) a run of days for a member. */
  setStatus: (memberId: MemberId, days: readonly Day[], status: Status | null) => Promise<void>;
  dismissError: () => void;
}

/**
 * The window of dates to keep loaded.
 *
 * Wide enough to cover both the month being looked at and the whole six-month
 * best-dates horizon, so navigating months never leaves the Best Dates screen
 * reading from a partial set. Six people over seven months is a trivial query.
 */
function windowFor(visibleMonth: YearMonth, today: Day): { from: Day; to: Day } {
  const monthStart = firstOfMonth(visibleMonth);
  const monthEnd = lastOfMonth(visibleMonth);
  const horizonEnd = addDays(today, HORIZON_DAYS - 1);
  // Day strings are YYYY-MM-DD, so lexicographic order is chronological order.
  return {
    from: monthStart < today ? monthStart : today,
    to: monthEnd > horizonEnd ? monthEnd : horizonEnd,
  };
}

export function useBandData(visibleMonth: YearMonth, today: Day): BandData {
  const [roster, setRoster] = useState<Member[]>([]);
  const [me, setMe] = useState<Member | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { from, to } = useMemo(() => windowFor(visibleMonth, today), [visibleMonth, today]);

  // A ref so the realtime handler can refetch the current window without being
  // re-subscribed every time the month changes.
  const windowRef = useRef({ from, to });
  windowRef.current = { from, to };

  const loadMarks = useCallback(async () => {
    const { from: f, to: t } = windowRef.current;
    setMarks(await fetchMarks(f, t));
  }, []);

  const refreshMe = useCallback(async () => {
    setMe(await currentMember());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await ensureSession();
        const [loadedRoster, loadedMe] = await Promise.all([fetchRoster(), currentMember()]);
        if (cancelled) return;
        setRoster(loadedRoster);
        setMe(loadedMe);
        await loadMarks();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMarks]);

  // Refetch when the loaded window moves.
  useEffect(() => {
    let cancelled = false;
    loadMarks().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [from, to, loadMarks]);

  // Someone else marking a date should appear on the report you are already
  // looking at.
  useEffect(() => {
    return watchAvailability(() => {
      void loadMarks().catch(() => {
        /* a dropped refresh is not worth interrupting the user over */
      });
    });
  }, [loadMarks]);

  const setStatus = useCallback(
    async (memberId: MemberId, days: readonly Day[], status: Status | null) => {
      if (days.length === 0) return;
      const touched = new Set(days);
      const previous = marks;

      // Apply locally first. Marking a month should feel instant on a phone.
      setMarks((current) => {
        const kept = current.filter((m) => !(m.memberId === memberId && touched.has(m.day)));
        return status === null
          ? kept
          : [...kept, ...days.map((day) => ({ memberId, day, status }))];
      });

      try {
        await writeStatus(memberId, days, status);
      } catch (e) {
        setMarks(previous); // put it back; the write did not happen
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [marks],
  );

  const index = useMemo(() => indexMarks(marks), [marks]);

  return {
    roster,
    me,
    index,
    loading,
    error,
    refreshMe,
    setStatus,
    dismissError: useCallback(() => setError(null), []),
  };
}
