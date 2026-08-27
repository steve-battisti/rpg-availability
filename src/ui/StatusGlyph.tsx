import { STATUS_META, type CellState } from './status';

/**
 * A status glyph with its accessible name.
 *
 * Unset renders no glyph but still announces "No answer yet", so a screen
 * reader user hears the same four states a sighted user sees.
 */
export function StatusGlyph({ state, className = '' }: { state: CellState; className?: string }) {
  const { glyph, label } = STATUS_META[state];
  return (
    <span className={`font-display ${className}`}>
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
