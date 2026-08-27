import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type Mark, indexMarks } from '../lib/availability';
import { ROSTER } from '../lib/roster';
import { BestDatesScreen } from './BestDatesScreen';

const TODAY = '2026-10-01'; // a Thursday

function setup(marks: Mark[] = []) {
  render(
    <BestDatesScreen
      roster={ROSTER}
      index={indexMarks(marks)}
      theme="light"
      today={TODAY}
    />,
  );
}

function say(day: string, count: number, status: Mark['status']): Mark[] {
  return ROSTER.slice(0, count).map((m) => ({ memberId: m.id, day, status }));
}

const section = (name: RegExp) => screen.getByRole('heading', { name }).parentElement!;

describe('bucketing', () => {
  it('puts a Friday under gigs and a Tuesday under practice', () => {
    setup([...say('2026-10-02', 4, 'available'), ...say('2026-10-06', 4, 'available')]);
    expect(within(section(/GIGS/)).getByText('FRI OCT 2')).toBeInTheDocument();
    expect(within(section(/PRACTICE/)).getByText('TUE OCT 6')).toBeInTheDocument();
  });

  it('says so plainly when nothing has been marked', () => {
    setup();
    expect(screen.getByText(/Nobody has marked a Friday/)).toBeInTheDocument();
    expect(screen.getByText(/Nobody has marked a weeknight/)).toBeInTheDocument();
  });
});

describe('ranking', () => {
  it('lists the strongest date first', () => {
    setup([
      ...say('2026-10-02', 2, 'available'),
      ...say('2026-10-09', 6, 'available'),
      ...say('2026-10-16', 4, 'available'),
    ]);
    const headings = within(section(/GIGS/))
      .getAllByText(/^FRI OCT/)
      .map((n) => n.textContent);
    expect(headings).toEqual(['FRI OCT 9', 'FRI OCT 16', 'FRI OCT 2']);
  });

  it('omits a date nobody said yes to', () => {
    setup(say('2026-10-02', 6, 'unavailable'));
    expect(screen.queryByText('FRI OCT 2')).not.toBeInTheDocument();
  });
});

describe('honesty about thin dates', () => {
  it('says how many have not answered', () => {
    setup(say('2026-10-02', 3, 'available'));
    expect(screen.getByText(/3 haven't answered/)).toBeInTheDocument();
  });

  it('says so when the whole band has answered', () => {
    setup([...say('2026-10-02', 3, 'available'), ...say('2026-10-02', 6, 'unavailable')]);
    // Everyone answered; the first three were overwritten to unavailable, so
    // this date should not appear at all.
    expect(screen.queryByText('FRI OCT 2')).not.toBeInTheDocument();
  });

  it('labels a fully answered date as such', () => {
    setup([
      ...say('2026-10-02', 6, 'available'),
    ]);
    expect(screen.getByText(/everyone answered/)).toBeInTheDocument();
  });

  it('shows the score against the band size', () => {
    setup(say('2026-10-02', 4, 'available'));
    const card = screen.getByText('FRI OCT 2').closest('li')!;
    expect(within(card).getByText('4')).toBeInTheDocument();
    expect(within(card).getByText('/6')).toBeInTheDocument();
  });
});
