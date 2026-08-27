import { formatScore } from '../lib/format';
import { type Theme, heatStyle } from '../lib/heat';

const LEVELS = [0, 1, 2, 3, 4, 5, 6];

/**
 * The explicit heat scale, shown in the desktop report's right rail.
 *
 * Every swatch is drawn hatched, because the hatch is the part that needs
 * teaching: the colour ramp reads intuitively on its own, but "diagonal lines
 * mean somebody has not answered" does not.
 */
export function HeatLegend({ theme, bandSize }: { theme: Theme; bandSize: number }) {
  return (
    <div>
      <h4 className="font-body text-[11px] font-bold text-ink-muted">Heat legend</h4>
      <ul className="mt-2 flex list-none flex-col gap-1 p-0">
        {LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-2">
            <span
              className="flex h-[18px] w-6 shrink-0 items-center justify-center rounded-[6px] border border-border font-display text-[9px]"
              style={heatStyle(level, 1, theme)}
              aria-hidden="true"
            >
              {formatScore(level)}
            </span>
            <span className="font-body text-[11px] text-ink-muted">
              {level}/{bandSize} available · hatch = someone silent
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
