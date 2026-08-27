import { STATUS_META, type CellState } from './status';
import { StatusGlyph } from './StatusGlyph';

/**
 * One person's answer for the selected date, as a tinted pill row.
 *
 * The name is allowed to breathe rather than truncate: the roster runs from
 * "JT" to "Katie" and the design is explicit that neither may clip.
 */
export function MemberRow({
  name,
  state,
  trailing,
}: {
  name: string;
  state: CellState;
  trailing?: string;
}) {
  return (
    <div
      className={`flex min-h-11 items-center gap-3 rounded-[12px] border-2 px-3 py-2 ${STATUS_META[state].className}`}
    >
      <span className="font-body text-[13px] font-bold">{name}</span>
      {trailing ? <span className="font-body text-[11px] opacity-70">{trailing}</span> : null}
      <StatusGlyph state={state} className="ml-auto text-[15px]" />
    </div>
  );
}
