/**
 * The four cell states, and the glyph each one carries.
 *
 * The glyph is not decoration. The design's accessibility claim rests on state
 * never being encoded in colour alone, so a component that renders a status
 * without its glyph has broken that claim.
 */

import type { Status } from '../lib/availability';

/** `undefined` in the data model; a real, common state on screen. */
export type CellState = Status | 'unset';

export interface StatusMeta {
  /** ✓ × ? or the empty string for unset — never omit it. */
  glyph: string;
  /** Tailwind classes for the state's background and ink. */
  className: string;
  /** Spoken by a screen reader in place of the glyph. */
  label: string;
}

export const STATUS_META: Record<CellState, StatusMeta> = {
  available: {
    glyph: '✓',
    className: 'bg-available text-available-ink border-available-ink',
    label: 'Available',
  },
  maybe: {
    glyph: '?',
    className: 'bg-maybe text-maybe-ink border-maybe-ink',
    label: 'Maybe',
  },
  unavailable: {
    glyph: '×',
    className: 'bg-unavailable text-unavailable-ink border-unavailable-ink',
    label: 'Unavailable',
  },
  unset: {
    glyph: '',
    className: 'bg-unset text-unset-ink border-unset-border',
    label: 'No answer yet',
  },
};

/**
 * The tap cycle on the Mark Availability screen, straight from the design:
 * unset → available → maybe → unavailable → unset.
 */
export const CYCLE: readonly CellState[] = ['unset', 'available', 'maybe', 'unavailable'];

export function nextState(current: CellState): CellState {
  const i = CYCLE.indexOf(current);
  return CYCLE[(i + 1) % CYCLE.length] as CellState;
}

/** Data-model status (`undefined` = unmarked) to on-screen cell state. */
export function toCellState(status: Status | undefined): CellState {
  return status ?? 'unset';
}

/** On-screen cell state back to a data-model status. */
export function toStatus(state: CellState): Status | undefined {
  return state === 'unset' ? undefined : state;
}
