/**
 * Design preview — every screen, fixture data, no network.
 *
 * This exists so `npm run shot` can check the real screens against
 * design/mars-funk/screenshots/ without a Supabase session. It imports nothing
 * from src/data, so it cannot read or write the live project.
 */

import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { type Mark, type MemberId, type Status, indexMarks } from '../lib/availability';
import type { Day } from '../lib/day';
import { monthOf } from '../lib/month';
import { ROSTER } from '../lib/roster';
import { BestDatesScreen } from '../screens/BestDatesScreen';
import { EntryScreen } from '../screens/EntryScreen';
import { MarkScreen } from '../screens/MarkScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../theme/useTheme';
import { fixtureMarks } from './fixtures';
import '../styles/theme.css';

/** Pinned, so the preview renders the same month every run. */
const TODAY: Day = '2026-10-01';

function Preview() {
  const { theme, toggle } = useTheme();
  const [marks, setMarks] = useState<Mark[]>(() => fixtureMarks(TODAY));
  const [visibleMonth, setVisibleMonth] = useState(() => monthOf(TODAY));
  const index = useMemo(() => indexMarks(marks), [marks]);
  const me = ROSTER[0]!; // Steve, so the admin switcher is visible

  async function setStatus(memberId: MemberId, days: readonly Day[], status: Status | null) {
    const touched = new Set(days);
    setMarks((current) => {
      const kept = current.filter((m) => !(m.memberId === memberId && touched.has(m.day)));
      return status === null ? kept : [...kept, ...days.map((day) => ({ memberId, day, status }))];
    });
  }

  return (
    <div className="mx-auto flex max-w-[430px] flex-col gap-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[22px] leading-tight text-accent">
          RED PLANET
          <br />
          GROOVE
        </h1>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </header>
      <p className="font-body text-[11px] text-ink-muted">
        Design preview · fixture data · not connected to the band&rsquo;s calendar
      </p>

      <EntryScreen roster={ROSTER} onClaimed={() => {}} />
      <MarkScreen
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        roster={ROSTER}
        me={me}
        index={index}
        today={TODAY}
        onSetStatus={setStatus}
      />
      <ReportScreen
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        roster={ROSTER}
        index={index}
        theme={theme}
        today={TODAY}
      />
      <BestDatesScreen roster={ROSTER} index={index} theme={theme} today={TODAY} />
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');
createRoot(root).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
