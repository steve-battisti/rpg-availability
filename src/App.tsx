/**
 * App shell — session gate and navigation.
 *
 * The Mars Funk design is four standalone artboards with no navigation chrome of
 * its own, so the tab row here is an addition rather than a reproduction. It is
 * built from the design's existing pill vocabulary rather than inventing a new
 * one.
 */

import { useMemo, useState } from 'react';
import { today as readToday } from './lib/clock';
import { monthOf, type YearMonth } from './lib/month';
import { useBandData } from './data/useBandData';
import { BestDatesScreen } from './screens/BestDatesScreen';
import { EntryScreen } from './screens/EntryScreen';
import { MarkScreen } from './screens/MarkScreen';
import { ReportScreen } from './screens/ReportScreen';
import { Card } from './ui/Card';
import { ThemeToggle } from './ui/ThemeToggle';
import { useTheme } from './theme/useTheme';

type Tab = 'mark' | 'report' | 'best';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mark', label: 'Mark' },
  { id: 'report', label: 'Report' },
  { id: 'best', label: 'Best dates' },
];

export function App() {
  const { theme, toggle } = useTheme();
  // Read the clock once per mount. Everything downstream takes `today` as an
  // argument, so nothing else in the app has to be time-dependent.
  const today = useMemo(() => readToday(), []);
  const [visibleMonth, setVisibleMonth] = useState<YearMonth>(() => monthOf(today));
  const [tab, setTab] = useState<Tab>('mark');

  const band = useBandData(visibleMonth, today);

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

      {band.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border-2 border-accent bg-surface px-3 py-2"
        >
          <p className="font-body text-[12px] text-ink">{band.error}</p>
          <button
            type="button"
            onClick={band.dismissError}
            aria-label="Dismiss"
            className="ml-auto font-display text-[13px] text-accent"
          >
            ×
          </button>
        </div>
      ) : null}

      {band.loading ? (
        <Card>
          <p className="font-body text-[13px] text-ink-muted">Warming up the tour bus…</p>
        </Card>
      ) : !band.me ? (
        <EntryScreen roster={band.roster} onClaimed={band.refreshMe} />
      ) : (
        <>
          <nav className="flex gap-1.5" aria-label="Screens">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`min-h-11 flex-1 rounded-[20px] border-2 px-3 py-2 font-body text-[13px] font-bold ${
                  tab === id
                    ? 'border-accent bg-available text-available-ink'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === 'mark' ? (
            <MarkScreen
              visibleMonth={visibleMonth}
              onMonthChange={setVisibleMonth}
              roster={band.roster}
              me={band.me}
              index={band.index}
              today={today}
              onSetStatus={band.setStatus}
            />
          ) : null}

          {tab === 'report' ? (
            <ReportScreen
              visibleMonth={visibleMonth}
              onMonthChange={setVisibleMonth}
              roster={band.roster}
              index={band.index}
              theme={theme}
              today={today}
            />
          ) : null}

          {tab === 'best' ? (
            <BestDatesScreen
              roster={band.roster}
              index={band.index}
              theme={theme}
              today={today}
            />
          ) : null}

          <p className="pb-2 text-center font-body text-[11px] text-ink-muted">
            Signed in as {band.me.name}
            {band.me.isAdmin ? ' · Admin' : ''}
          </p>
        </>
      )}
    </div>
  );
}
