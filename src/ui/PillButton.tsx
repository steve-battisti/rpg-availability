import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { STATUS_META, type CellState } from './status';

type Tone = 'neutral' | 'accent' | CellState;

function toneClasses(tone: Tone): string {
  if (tone === 'neutral') return 'bg-surface text-ink border-border';
  if (tone === 'accent') return 'bg-surface text-accent border-accent';
  return STATUS_META[tone].className;
}

/**
 * The design's pill button — 2px border, 12px radius, Karla bold.
 *
 * `min-h-11` keeps every pill at or above the ~44px touch target the platform
 * guidelines ask for; the design's own padding lands close to this already, and
 * this screen is used one-handed on a phone.
 */
export function PillButton({
  children,
  tone = 'neutral',
  className = '',
  ...props
}: {
  children: ReactNode;
  tone?: Tone;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`min-h-11 rounded-[20px] border-2 px-4 py-3 font-body text-[13px] font-bold ${toneClasses(tone)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
