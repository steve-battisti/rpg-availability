/**
 * Best Dates — the screen someone reads aloud while a bar owner waits.
 *
 * Ranking is `score desc, then soonest`, and nothing else. The count of members
 * who have not answered is shown but never sorts: the band decides whether three
 * yeses and three silences is worth a phone call, not the sort function.
 */

import { useMemo } from 'react';
import type { AvailabilityIndex, Member } from '../lib/availability';
import { type BestDates, rankBestDates } from '../lib/bestDates';
import type { DayTally } from '../lib/availability';
import type { Day } from '../lib/day';
import { formatOutOf, formatScore } from '../lib/format';
import { type Theme, heatStyle } from '../lib/heat';
import { relativeWeekLabel, shortDateLabel } from '../lib/month';
import { Card } from '../ui/Card';

const LIMIT = 6;

function DateCard({
  tally,
  today,
  theme,
  bandSize,
  emphasised,
}: {
  tally: DayTally;
  today: Day;
  theme: Theme;
  bandSize: number;
  emphasised: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between rounded-[16px] border-2 p-3.5 ${
        emphasised ? 'border-accent' : 'border-border'
      }`}
    >
      <div>
        <div className="font-display text-[16px]">{shortDateLabel(tally.day)}</div>
        <div className="font-body text-[10.5px] text-ink-muted">
          {relativeWeekLabel(tally.day, today)}
          {tally.unknownCount > 0
            ? ` · ${tally.unknownCount} haven't answered`
            : ' · everyone answered'}
        </div>
      </div>
      <div
        className="rounded-[10px] px-2 py-0.5 font-display text-[26px]"
        style={heatStyle(tally.score, tally.unknownCount, theme)}
      >
        {formatScore(tally.score)}
        <span className="text-[13px]">{formatOutOf(bandSize)}</span>
      </div>
    </li>
  );
}

function Section({
  title,
  dates,
  today,
  theme,
  bandSize,
  emphasised,
  empty,
}: {
  title: string;
  dates: DayTally[];
  today: Day;
  theme: Theme;
  bandSize: number;
  emphasised: boolean;
  empty: string;
}) {
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="font-body text-[11px] font-bold tracking-wide text-ink-muted">{title}</h3>
      {dates.length === 0 ? (
        <p className="mt-2 font-body text-[12px] text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex list-none flex-col gap-2 p-0">
          {dates.map((tally) => (
            <DateCard
              key={tally.day}
              tally={tally}
              today={today}
              theme={theme}
              bandSize={bandSize}
              emphasised={emphasised}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function BestDatesScreen({
  roster,
  index,
  theme,
  today,
}: {
  roster: readonly Member[];
  index: AvailabilityIndex;
  theme: Theme;
  today: Day;
}) {
  const best: BestDates = useMemo(
    () => rankBestDates({ roster, index, today, limit: LIMIT }),
    [roster, index, today],
  );

  return (
    <Card>
      <h2 className="font-display text-[16px] text-accent">BEST DATES</h2>
      <p className="mt-1 font-body text-[10.5px] text-ink-muted">
        Next six months, best first. A maybe counts as half.
      </p>

      <Section
        title="🎸 GIGS · FRI–SUN"
        dates={best.gig}
        today={today}
        theme={theme}
        bandSize={roster.length}
        emphasised
        empty="Nobody has marked a Friday, Saturday or Sunday yet."
      />

      <Section
        title="🥁 PRACTICE · MON–THU"
        dates={best.practice}
        today={today}
        theme={theme}
        bandSize={roster.length}
        emphasised={false}
        empty="Nobody has marked a weeknight yet."
      />
    </Card>
  );
}
