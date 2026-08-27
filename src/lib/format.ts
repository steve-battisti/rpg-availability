/**
 * Display formatting for scores.
 *
 * The design renders half-points with a vulgar fraction — "5½", not "5.5" — so
 * the numerals stay narrow enough to centre in a date cell. That is one
 * decision, so it lives in one tested function rather than being re-derived in
 * every component that prints a score.
 */

/** A Maybe is half a person, so halves are the only fractions that occur. */
export function formatScore(score: number): string {
  if (!Number.isFinite(score)) return '0';
  const whole = Math.floor(score);
  const hasHalf = score - whole >= 0.5;
  return hasHalf ? `${whole}½` : String(whole);
}

/** The Best Dates cards print "6/6"; this is the denominator half. */
export function formatOutOf(bandSize: number): string {
  return `/${bandSize}`;
}

/**
 * "3 haven't answered" — the phrase that keeps a thin date honest.
 * Returns `undefined` when everyone has answered, so callers can omit the tag.
 */
export function formatSilentTag(silentCount: number): string | undefined {
  return silentCount > 0 ? `+${silentCount}` : undefined;
}
