/**
 * Theme proof harness.
 *
 * Temporary: this exists so the Mars Funk tokens, the heat ramp and the shared
 * primitives can be checked against the design screenshots before any real
 * screen is built. Plan 04 replaces it with the actual app.
 */

import { formatOutOf, formatScore, formatSilentTag } from './lib/format';
import { heatStyle } from './lib/heat';
import { BAND_SIZE, ROSTER } from './lib/roster';
import { Card } from './ui/Card';
import { MemberRow } from './ui/MemberRow';
import { StatusGlyph } from './ui/StatusGlyph';
import { ThemeToggle } from './ui/ThemeToggle';
import { CYCLE, type CellState } from './ui/status';
import { useTheme } from './theme/useTheme';

const SAMPLE_STATES: CellState[] = ['available', 'maybe', 'unavailable', 'unset', 'available', 'unset'];

export function App() {
  const { theme, toggle } = useTheme();

  return (
    <main className="mx-auto flex max-w-[430px] flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[22px] leading-tight text-accent">
          RED PLANET
          <br />
          GROOVE
        </h1>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>

      <Card>
        <h2 className="mb-3 font-display text-[16px] text-accent">CELL STATES</h2>
        <div className="flex flex-wrap gap-2">
          {CYCLE.map((state) => (
            <div
              key={state}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-[10px] border-2 border-border"
            >
              <StatusGlyph state={state} className="text-[16px]" />
            </div>
          ))}
        </div>
        <p className="mt-3 font-body text-[10.5px] text-ink-muted">
          ✓ free &nbsp; × busy &nbsp; ? maybe &nbsp; empty = TBD
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-[16px] text-accent">HEAT SCALE</h2>
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((level) => {
            const answered = heatStyle(level, 0, theme);
            const silent = heatStyle(level, 2, theme);
            return (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="flex h-10 w-14 items-center justify-center rounded-[10px] border-2 border-border font-display text-[15px]"
                  style={answered}
                >
                  {formatScore(level)}
                </div>
                <div
                  className="relative flex h-10 w-14 items-center justify-center rounded-[10px] border-2 border-border font-display text-[15px]"
                  style={silent}
                >
                  {formatScore(level)}
                  <span className="absolute top-0.5 right-1 font-body text-[9px]">
                    {formatSilentTag(2)}
                  </span>
                </div>
                <span className="font-body text-[11px] text-ink-muted">
                  {level}/{BAND_SIZE} available · hatch = someone silent
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-[16px] text-accent">SATURDAY, OCTOBER 17</h2>
        <div className="flex flex-col gap-1.5">
          {ROSTER.map((member, i) => (
            <MemberRow
              key={member.id}
              name={member.name}
              state={SAMPLE_STATES[i] ?? 'unset'}
              {...(member.isAdmin ? { trailing: 'Admin' } : {})}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-[16px] text-accent">BEST DATES</h2>
        <div className="flex items-center justify-between rounded-[16px] border-2 border-accent p-3.5">
          <div>
            <div className="font-display text-[16px]">FRI OCT 23</div>
            <div className="font-body text-[10.5px] text-ink-muted">Next week</div>
          </div>
          <div
            className="rounded-[10px] px-2 font-display text-[26px]"
            style={heatStyle(6, 0, theme)}
          >
            6<span className="text-[13px]">{formatOutOf(BAND_SIZE)}</span>
          </div>
        </div>
      </Card>
    </main>
  );
}
