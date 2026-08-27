/**
 * The one place the real clock is consulted.
 *
 * Everything else takes `today` as an argument so it stays pure and testable.
 * This deliberately reads the *local* calendar date rather than UTC: a member in
 * Denver at 11pm is still living in that day, and telling them it is already
 * tomorrow would be wrong in exactly the way this app cannot afford.
 */

import type { Day } from './day';

export function today(now: Date = new Date()): Day {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}
