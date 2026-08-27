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
import { signOut } from './data/session';
import { BestDatesScreen } from './screens/BestDatesScreen';
import { EntryScreen } from './screens/EntryScreen';
import { MarkScreen } from './screens/MarkScreen';
import { ReportScreen } from './screens/ReportScreen';
import { Card } from './ui/Card';
import { SessionFooter } from './ui/SessionFooter';
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
    <div className="mx-auto flex max-w-[430px] flex-col gap-3 p-4 desk:max-w-[1040px]">
      {/*
        The Entry screen carries the wordmark inside its own card, as the design
        draws it. Repeating it in the shell header would show it twice on the one
        screen where it matters most.
      */}
      <header className="flex items-start justify-between gap-3">
        {band.me ? (
          <h1 className="font-display text-[22px] leading-tight text-accent">
            RED PLANET
            <br />
            GROOVE
          </h1>
        ) : (
          <span />
        )}
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
            /* The design draws Best Dates at mobile width only; stretching a
               list of six cards across 1040px would only make it harder to
               read aloud, which is the screen's whole job. */
            <BestDatesScreen
              className="desk:mx-auto desk:max-w-[560px]"
              roster={band.roster}
              index={band.index}
              theme={theme}
              today={today}
            />
          ) : null}

          <SessionFooter
            name={band.me.name}
            isAdmin={band.me.isAdmin}
            onSignOut={() => {
              void signOut().then(() => {
                // A full reload is the honest reset: it drops every cached
                // mark, the visible month and the tab along with the session,
                // so nothing from the previous member can linger on screen.
                location.reload();
              });
            }}
          />
        </>
      )}
    </div>
  );
}
