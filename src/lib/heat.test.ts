import { describe, expect, it } from 'vitest';
import {
  MAX_HEAT_LEVEL,
  type Theme,
  hatchImage,
  heatColor,
  heatInk,
  heatLevel,
  heatStyle,
} from './heat';

const THEMES: Theme[] = ['light', 'dark'];
const LEVELS = [0, 1, 2, 3, 4, 5, 6];

/* --- WCAG helpers, test-only ------------------------------------------- */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lum = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lum, 1 - lum);
  const f = (n: number) => lum - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

function parseHsl(value: string): [number, number, number] {
  const m = /^hsl\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)$/.exec(value);
  if (!m) throw new Error(`Not an hsl() string: ${value}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function levelContrast(level: number, theme: Theme): number {
  const [h, s, l] = parseHsl(heatColor(level, theme));
  return contrastRatio(hslToRgb(h, s, l), hexToRgb(heatInk(level, theme)));
}

/* --- tests -------------------------------------------------------------- */

describe('heatLevel', () => {
  it('maps whole scores to their own level', () => {
    expect(LEVELS.map(heatLevel)).toEqual(LEVELS);
  });

  it('rounds half-points up', () => {
    // A 3½ date paints as a 4 while still printing "3½" as its numeral.
    expect(heatLevel(3.5)).toBe(4);
    expect(heatLevel(0.5)).toBe(1);
  });

  it('clamps above the band size', () => {
    expect(heatLevel(7)).toBe(MAX_HEAT_LEVEL);
    expect(heatLevel(99)).toBe(MAX_HEAT_LEVEL);
  });

  it('clamps below zero', () => {
    expect(heatLevel(-1)).toBe(0);
    expect(heatLevel(-0.4)).toBe(0);
  });

  it('does not throw on a non-finite score', () => {
    expect(heatLevel(Number.NaN)).toBe(0);
    expect(heatLevel(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('heatColor', () => {
  it('uses the olive hue at every level, never red', () => {
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        expect(parseHsl(heatColor(level, theme))[0]).toBe(88);
      }
    }
  });

  it('matches the documented light-theme formula', () => {
    expect(heatColor(0, 'light')).toBe('hsl(88 35% 94%)');
    expect(heatColor(6, 'light')).toBe('hsl(88 77% 34%)');
  });

  it('matches the documented dark-theme formula', () => {
    expect(heatColor(0, 'dark')).toBe('hsl(88 30% 14%)');
    expect(heatColor(6, 'dark')).toBe('hsl(88 78% 56%)');
  });

  it('rises monotonically in saturation, so more availability always reads stronger', () => {
    for (const theme of THEMES) {
      const sats = LEVELS.map((l) => parseHsl(heatColor(l, theme))[1]);
      expect(sats).toEqual([...sats].sort((a, b) => a - b));
      expect(new Set(sats).size).toBe(LEVELS.length);
    }
  });

  it('darkens as the score rises in light theme, and lightens in dark theme', () => {
    const light = LEVELS.map((l) => parseHsl(heatColor(l, 'light'))[2]);
    expect(light).toEqual([...light].sort((a, b) => b - a));
    const dark = LEVELS.map((l) => parseHsl(heatColor(l, 'dark'))[2]);
    expect(dark).toEqual([...dark].sort((a, b) => a - b));
  });

  it('clamps out-of-range levels rather than producing impossible colors', () => {
    expect(heatColor(-3, 'light')).toBe(heatColor(0, 'light'));
    expect(heatColor(50, 'dark')).toBe(heatColor(6, 'dark'));
  });
});

describe('contrast', () => {
  // The heat numeral is large Bungee display type, so WCAG AA for large text
  // (3:1) is the bar that actually applies to it.
  it('clears 3:1 at every level in both themes', () => {
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        expect(levelContrast(level, theme)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('clears the stricter 4.5:1 everywhere except dark level 3', () => {
    // Audited 2026-08-27: dark level 3 is 4.47:1 — a hair under AA for normal
    // text, comfortably over AA for the large numerals it is actually used for.
    // Pinned so that changing the ramp surfaces this rather than hiding it.
    const failures: string[] = [];
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        if (levelContrast(level, theme) < 4.5) failures.push(`${theme}:${level}`);
      }
    }
    expect(failures).toEqual(['dark:3']);
    expect(levelContrast(3, 'dark')).toBeGreaterThan(4.4);
  });
});

describe('hatch', () => {
  it('is absent when everyone has answered', () => {
    expect(hatchImage(0, 'light')).toBeUndefined();
    expect(hatchImage(-1, 'dark')).toBeUndefined();
  });

  it('appears as soon as one member is silent', () => {
    expect(hatchImage(1, 'light')).toContain('repeating-linear-gradient');
  });

  it('darkens on light theme and lightens on dark theme', () => {
    expect(hatchImage(1, 'light')).toContain('rgba(0,0,0,.08)');
    expect(hatchImage(1, 'dark')).toContain('rgba(255,255,255,.10)');
  });

  it('does not vary with how many are silent, only whether any are', () => {
    expect(hatchImage(1, 'light')).toBe(hatchImage(6, 'light'));
  });
});

describe('heatStyle', () => {
  it('bundles colour, ink and level for a fully answered date', () => {
    const s = heatStyle(6, 0, 'light');
    expect(s).toEqual({
      background: 'hsl(88 77% 34%)',
      color: '#132015',
      backgroundImage: undefined,
      backgroundSize: undefined,
      level: 6,
    });
  });

  it('adds the hatch and its tile size when someone is silent', () => {
    const s = heatStyle(3, 3, 'dark');
    expect(s.backgroundImage).toContain('repeating-linear-gradient');
    expect(s.backgroundSize).toBe('7px 7px');
  });

  it('gives 3-yes-3-silent and 3-yes-3-no the same colour but different texture', () => {
    const silent = heatStyle(3, 3, 'light');
    const answered = heatStyle(3, 0, 'light');
    expect(silent.background).toBe(answered.background);
    expect(silent.backgroundImage).toBeDefined();
    expect(answered.backgroundImage).toBeUndefined();
  });
});
