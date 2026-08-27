/**
 * The band. Fixed roster, seeded rather than self-service — adding a member is
 * a migration, not a feature (see `concepts/rpg-availability.md` R1).
 */

import type { Member } from './availability';

export const ROSTER: readonly Member[] = [
  { id: 'steve', name: 'Steve', isAdmin: true },
  { id: 'katie', name: 'Katie', isAdmin: false },
  { id: 'mike', name: 'Mike', isAdmin: false },
  { id: 'fran', name: 'Fran', isAdmin: false },
  { id: 'rob', name: 'Rob', isAdmin: false },
  { id: 'jt', name: 'JT', isAdmin: false },
];

/** Everyone in the band. */
export const BAND_SIZE = ROSTER.length;
