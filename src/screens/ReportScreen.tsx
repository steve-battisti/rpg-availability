/**
 * Availability Report — the combined heat calendar plus a selected-date detail.
 *
 * The thing this screen exists to prevent: reading "3 available" and assuming
 * the other three said no. Every cell carries its numeral, and carries a hatch
 * plus a "+n" tag whenever anyone simply has not answered.
 */

import { useMemo, useState } from 'react';
import { type AvailabilityIndex, type Member, statusOf, tallyDay } from '../lib/availability';
import type { Day } from '../lib/day';
import { formatScore, formatSilentTag } from '../lib/format';
import { type Theme, heatStyle } from '../lib/heat';
import {
  WEEKDAY_HEADINGS,
  type YearMonth,
  clampToMonth,
  dayNumber,
  longDateLabel,
  monthGrid,
  monthLabel,
  monthLabelLong,
  shiftMonth,
  todayOrFirstOfMonth,
} from '../lib/month';
import { Card } from '../ui/Card';
import { HeatLegend } from '../ui/HeatLegend';
import { MemberRow } from '../ui/MemberRow';
import { toCellState } from '../ui/status';

export function ReportScreen({
  visibleMonth,
  onMonthChange,
  roster,
  index,
  theme,
  today,
}: {
  visibleMonth: YearMonth;
  onMonthChange: (ym: YearMonth) => void;
  roster: readonly Member[];
  index: AvailabilityIndex;
  theme: Theme;
  today: Day;
}) {
  const [selected, setSelected] = useState<Day>(() =>
    todayOrFirstOfMonth(visibleMonth, today),
  );
  const grid = useMemo(() => monthGrid(visibleMonth), [visibleMonth]);
  const selectedInMonth = clampToMonth(selected, visibleMonth);
  const detail = tallyDay(selectedInMonth, roster, index);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className="min-h-11 px-2 font-display text-[16px] text-accent"
          onClick={() => onMonthChange(shiftMonth(visibleMonth, -1))}
        >
          ‹
        </button>
        <h2 className="font-display text-[16px] text-accent desk:text-[22px]">
          <span className="desk:hidden">{monthLabel(visibleMonth)} — CREW</span>
          <span className="hidden desk:inline">{monthLabelLong(visibleMonth)} — CREW</span>
        </h2>
        <button
          type="button"
          aria-label="Next month"
          className="min-h-11 px-2 font-display text-[16px] text-accent"
          onClick={() => onMonthChange(shiftMonth(visibleMonth, 1))}
        >
          ›
        </button>
      </div>

      {/*
        Desktop is two columns: the heat grid, and a fixed 230px rail carrying
        the selected date and an explicit legend. On mobile the rail is simply
        the content below the grid, which is what the mobile artboard shows.
      */}
      <div className="desk:flex desk:items-start desk:gap-5">
      <div className="desk:min-w-0 desk:flex-1">
      <div className="mt-4 grid grid-cols-7 gap-[5px] desk:gap-[9px]">
        {WEEKDAY_HEADINGS.map((heading) => (
          <div key={heading} className="text-center font-display text-[10px] text-ink-muted">
            {heading}
          </div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-[5px] desk:gap-[9px]">
        {grid.flat().map((day, i) => {
          if (!day) return <div key={`blank-${i}`} aria-hidden="true" />;
          const tally = tallyDay(day, roster, index);
          const style = heatStyle(tally.score, tally.unknownCount, theme);
          const silentTag = formatSilentTag(tally.unknownCount);
          const isSelected = day === selectedInMonth;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(day)}
              aria-pressed={isSelected}
              aria-label={`${day} — ${formatScore(tally.score)} of ${roster.length} available${
                tally.unknownCount > 0 ? `, ${tally.unknownCount} not answered` : ''
              }`}
              className={`relative aspect-square rounded-[10px] border-2 desk:aspect-auto desk:h-[82px] desk:rounded-[14px] ${
                isSelected ? 'border-accent' : 'border-border'
              }`}
              style={style}
            >
              <span className="absolute top-0.5 left-1 font-body text-[9px] opacity-70">
                {dayNumber(day)}
              </span>
              {silentTag ? (
                <span
                  className="absolute top-0.5 right-1 font-body text-[8px] opacity-70"
                  aria-hidden="true"
                >
                  {silentTag}
                </span>
              ) : null}
              <span className="font-display text-[13px] desk:text-[20px]" aria-hidden="true">
                {formatScore(tally.score)}
              </span>
            </button>
          );
        })}
      </div>

      </div>

      <aside className="mt-4 border-t-2 border-border pt-4 desk:mt-0 desk:w-[230px] desk:shrink-0 desk:border-t-0 desk:border-l-2 desk:pt-4 desk:pl-5">
      <div>
        <h3 className="font-display text-[15px] text-accent">
          {longDateLabel(selectedInMonth)}
        </h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {roster.map((member) => (
            <MemberRow
              key={member.id}
              name={member.name}
              state={toCellState(statusOf(index, selectedInMonth, member.id))}
            />
          ))}
        </div>
        {detail.unknownCount > 0 ? (
          <p className="mt-3 font-body text-[11px] text-ink-muted">
            {detail.unknownCount} of {roster.length} haven&rsquo;t answered for this date.
          </p>
        ) : null}
      </div>

      <div className="mt-4 border-t-2 border-border pt-3 desk:hidden">
        <p className="font-body text-[10.5px] text-ink-muted">
          Darker green = more of the band free. Hatched = someone hasn&rsquo;t answered.
        </p>
      </div>

      <div className="mt-5 hidden desk:block">
        <HeatLegend theme={theme} bandSize={roster.length} />
      </div>
      </aside>
      </div>
    </Card>
  );
}
