import type { ReactNode } from 'react';

/**
 * The Mars Funk card frame: 24px radius, a chunky 3px accent border, surface
 * background. Every screen sits inside one.
 */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border-[3px] border-accent bg-surface px-[22px] py-[28px] ${className}`}
    >
      {children}
    </div>
  );
}
