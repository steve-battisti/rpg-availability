/**
 * Mark Availability — the highest-frequency screen.
 *
 * A member sweeps through a month setting their own dates. Tapping a cell cycles
 * it; bulk mode and "mark rest of month free" are the fast paths that make an
 * unset-means-unknown model survivable, because otherwise saying "I'm free all
 * October" would be thirty-one taps.
 */

import { useMemo, useState } from 'react';
import type { AvailabilityIndex, Member, MemberId, Status } from '../lib/availability';
import { statusOf } from '../lib/availability';
import type { Day } from '../lib/day';
import { editableMembers } from '../lib/permissions';
import {
  WEEKDAY_HEADINGS,
  type YearMonth,
  dayNumber,
  monthDays,
  monthGrid,
  monthLabel,
  monthLabelLong,
  shiftMonth,
} from '../lib/month';
import { Card } from '../ui/Card';
import { PillButton } from '../ui/PillButton';
import { STATUS_META, type CellState, nextState, toCellState, toStatus } from '../ui/status';

const APPLY_BUTTONS: { state: Status; label: string }[] = [
  { state: 'available', label: 'Mark selected available' },
  { state: 'maybe', label: 'Mark selected maybe' },
  { state: 'unavailable', label: 'Mark selected unavailable' },
];

export function MarkScreen({
  visibleMonth,
  onMonthChange,
  roster,
  me,
  index,
  today,
  onSetStatus,
}: {
  visibleMonth: YearMonth;
  onMonthChange: (ym: YearMonth) => void;
  roster: readonly Member[];
  me: Member;
  index: AvailabilityIndex;
  today: Day;
  onSetStatus: (memberId: MemberId, days: readonly Day[], status: Status | null) => Promise<void>;
}) {
  const [targetId, setTargetId] = useState<MemberId>(me.id);
  const [bulkMode, setBulkMode] = useState(false);
  const [selection, setSelection] = useState<Set<Day>>(new Set());

  const editable = useMemo(() => editableMembers(me, roster), [me, roster]);
  const target = editable.find((m) => m.id === targetId) ?? me;
  const grid = useMemo(() => monthGrid(visibleMonth), [visibleMonth]);

  function stateOf(day: Day): CellState {
    return toCellState(statusOf(index, day, target.id));
  }

  function tapCell(day: Day) {
    if (bulkMode) {
      setSelection((current) => {
        const next = new Set(current);
        if (next.has(day)) next.delete(day);
        else next.add(day);
        return next;
      });
      return;
    }
    void onSetStatus(target.id, [day], toStatus(nextState(stateOf(day))) ?? null);
  }

  function applyToSelection(status: Status) {
    const days = [...selection];
    setSelection(new Set());
    setBulkMode(false);
    void onSetStatus(target.id, days, status);
  }

  /**
   * "Mark rest of month free" — every still-unset date in this month, from today
   * forward. The design says "the visible month"; it does not say what to do
   * about dates already gone. Backfilling the past would be meaningless and
   * would pollute the report, so this never touches a date before today.
   */
  function markRestFree() {
    const days = monthDays(visibleMonth).filter(
      (day) => day >= today && stateOf(day) === 'unset',
    );
    void onSetStatus(target.id, days, 'available');
  }

  const restFreeCount = monthDays(visibleMonth).filter(
    (day) => day >= today && stateOf(day) === 'unset',
  ).length;

  return (
    <Card>
      {/*
        Desktop puts the month nav and the two actions on one line, as the
        desktop artboard draws them. On mobile they stack, which also brings the
        action buttons directly under the month nav the way the mobile artboard
        has them.
      */}
      <div className="desk:flex desk:items-center desk:justify-between desk:gap-4">
        <div className="flex items-center justify-between desk:justify-start desk:gap-1">
          <button
            type="button"
            aria-label="Previous month"
            className="min-h-11 px-2 font-display text-[16px] text-accent desk:text-[22px]"
            onClick={() => onMonthChange(shiftMonth(visibleMonth, -1))}
          >
            ‹
          </button>
          <h2 className="font-display text-[16px] text-accent desk:text-[22px]">
            <span className="desk:hidden">{monthLabel(visibleMonth)}</span>
            <span className="hidden desk:inline">
              {monthLabelLong(visibleMonth)} — {target.id === me.id ? 'MY AVAILABILITY' : `${target.name.toUpperCase()}'S AVAILABILITY`}
            </span>
          </h2>
          <button
            type="button"
            aria-label="Next month"
            className="min-h-11 px-2 font-display text-[16px] text-accent desk:text-[22px]"
            onClick={() => onMonthChange(shiftMonth(visibleMonth, 1))}
          >
            ›
          </button>
        </div>

        <div className="mt-3 flex gap-2 desk:mt-0 desk:shrink-0">
          <PillButton
            tone="available"
            className="flex-1 desk:flex-none desk:px-3.5 desk:py-3"
            onClick={markRestFree}
            disabled={restFreeCount === 0}
          >
            Mark rest of month free
          </PillButton>
          <PillButton
            className="desk:px-3.5 desk:py-3"
            onClick={() => {
              setBulkMode((on) => !on);
              setSelection(new Set());
            }}
            aria-pressed={bulkMode}
          >
            {bulkMode ? 'Done' : 'Select multiple'}
          </PillButton>
        </div>
      </div>

      {editable.length > 1 ? (
        <div className="mt-3">
          <p className="font-body text-[11px] text-ink-muted">Editing</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {editable.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setTargetId(member.id);
                  setSelection(new Set());
                }}
                aria-pressed={member.id === target.id}
                className={`min-h-9 rounded-[16px] border-2 px-3 py-1.5 font-body text-[12px] font-bold ${
                  member.id === target.id
                    ? 'border-accent bg-available text-available-ink'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                {member.id === me.id ? 'Me' : member.name}
              </button>
            ))}
          </div>
          {target.id !== me.id ? (
            <p className="mt-2 rounded-[12px] border-2 border-accent px-3 py-2 font-body text-[12px] font-bold text-accent">
              You&rsquo;re editing {target.name}&rsquo;s calendar, not your own.
            </p>
          ) : null}
        </div>
      ) : null}

      {bulkMode ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="font-body text-[12px] font-bold text-ink-muted">
            {selection.size} selected
          </span>
          <div className="ml-auto flex gap-1.5">
            {APPLY_BUTTONS.map(({ state, label }) => (
              <button
                key={state}
                type="button"
                aria-label={label}
                disabled={selection.size === 0}
                onClick={() => applyToSelection(state)}
                className={`min-h-9 rounded-[12px] border-2 px-3 py-1.5 font-display text-[13px] disabled:opacity-40 ${STATUS_META[state].className}`}
              >
                {STATUS_META[state].glyph}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          const state = stateOf(day);
          const selected = selection.has(day);
          const meta = STATUS_META[state];
          return (
            <button
              key={day}
              type="button"
              onClick={() => tapCell(day)}
              aria-label={`${day} — ${meta.label}`}
              aria-pressed={bulkMode ? selected : undefined}
              className={`relative aspect-square rounded-[10px] border-2 desk:aspect-auto desk:h-[66px] desk:rounded-[14px] ${meta.className} ${
                selected ? 'outline-2 outline-offset-1 outline-accent' : ''
              } ${day === today ? 'ring-1 ring-accent ring-inset' : ''}`}
            >
              <span className="absolute top-0.5 left-1 font-body text-[9px] text-ink-muted">
                {dayNumber(day)}
              </span>
              <span className="font-display text-[16px] desk:text-[22px]" aria-hidden="true">
                {meta.glyph}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 flex gap-2 font-body text-[10.5px] text-ink-muted">
        <span>✓ free</span>
        <span>× busy</span>
        <span>? maybe</span>
        <span>empty = TBD</span>
      </p>
    </Card>
  );
}
