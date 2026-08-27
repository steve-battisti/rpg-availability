import { describe, expect, it } from 'vitest';
import { formatOutOf, formatScore, formatSilentTag } from './format';
import { BAND_SIZE } from './roster';

describe('formatScore', () => {
  it('prints whole scores plainly', () => {
    expect(formatScore(0)).toBe('0');
    expect(formatScore(6)).toBe('6');
  });

  it('prints halves as a vulgar fraction, keeping the whole part', () => {
    // The design shows "0½" and "5½" — never "0.5" or "½" alone.
    expect(formatScore(0.5)).toBe('0½');
    expect(formatScore(5.5)).toBe('5½');
  });

  it('never widens to a decimal point', () => {
    for (let s = 0; s <= BAND_SIZE; s += 0.5) {
      expect(formatScore(s)).not.toContain('.');
    }
  });

  it('survives a non-finite score rather than printing NaN', () => {
    expect(formatScore(Number.NaN)).toBe('0');
  });
});

describe('formatOutOf', () => {
  it('renders the Best Dates denominator', () => {
    expect(formatOutOf(BAND_SIZE)).toBe('/6');
  });
});

describe('formatSilentTag', () => {
  it('is absent when everyone has answered', () => {
    expect(formatSilentTag(0)).toBeUndefined();
  });

  it('counts the silent members', () => {
    expect(formatSilentTag(1)).toBe('+1');
    expect(formatSilentTag(3)).toBe('+3');
  });
});
