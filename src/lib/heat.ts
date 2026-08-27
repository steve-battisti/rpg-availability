/**
 * The Availability Report heat ramp.
 *
 * Every constant here comes from `design/mars-funk/README.md` and is copied, not
 * chosen. The ramp is a single olive-green hue: the design deliberately never
 * uses red anywhere in the availability system, because red/green colorblindness
 * is the main risk on a green scale.
 *
 * Colour is never the only channel. A heat cell always carries its numeral, and
 * carries a diagonal hatch whenever anyone has yet to answer — that hatch is
 * what stops "3 yes / 3 silent" from reading as "3 yes / 3 no".
 */

/** Olive green. The only hue in the availability system. */
const HEAT_HUE = 88;

/** Scores run 0–6 for a six-piece band, so the ramp has seven steps. */
export const HEAT_LEVELS = 7;
export const MAX_HEAT_LEVEL = HEAT_LEVELS - 1;

export type Theme = 'light' | 'dark';

export interface HeatStyle {
  /** The ramp colour for this level. */
  background: string;
  /** Ink that stays legible on `background`. */
  color: string;
  /** Diagonal hatch, or `undefined` when everyone has answered. */
  backgroundImage: string | undefined;
  /** Tile size for the hatch, matching the reference build. */
  backgroundSize: string | undefined;
  level: number;
}

/**
 * Bucket a score into one of seven ramp steps.
 *
 * Half-points round up — a 3½ date shows the colour of a 4 while still printing
 * "3½" as its numeral, which is what the reference build does.
 */
export function heatLevel(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(MAX_HEAT_LEVEL, Math.max(0, Math.round(score)));
}

/** The ramp colour for a level, as an `hsl()` string. */
export function heatColor(level: number, theme: Theme): string {
  const l = Math.min(MAX_HEAT_LEVEL, Math.max(0, level));
  const [saturation, lightness] =
    theme === 'light' ? [35 + l * 7, 94 - l * 10] : [30 + l * 8, 14 + l * 7];
  return `hsl(${HEAT_HUE} ${saturation}% ${lightness}%)`;
}

/** Ink that holds up against the ramp colour at this level. */
export function heatInk(level: number, theme: Theme): string {
  if (theme === 'light') return level >= 4 ? '#132015' : '#1c2a1e';
  return level >= 3 ? '#0e150f' : '#e9f3ea';
}

/**
 * The hatch overlay, drawn only when at least one member is silent.
 *
 * Returns `undefined` rather than `'none'` so it can be spread straight into a
 * React style object and simply be absent when it does not apply.
 */
export function hatchImage(silentCount: number, theme: Theme): string | undefined {
  if (silentCount <= 0) return undefined;
  const stripe = theme === 'light' ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.10)';
  return `repeating-linear-gradient(45deg, ${stripe} 0 2px, transparent 2px 6px)`;
}

/** Everything needed to paint one heat cell. */
export function heatStyle(score: number, silentCount: number, theme: Theme): HeatStyle {
  const level = heatLevel(score);
  const backgroundImage = hatchImage(silentCount, theme);
  return {
    background: heatColor(level, theme),
    color: heatInk(level, theme),
    backgroundImage,
    backgroundSize: backgroundImage ? '7px 7px' : undefined,
    level,
  };
}
