import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type Mark, indexMarks } from '../lib/availability';
import { ROSTER } from '../lib/roster';
import { ReportScreen } from './ReportScreen';

const OCT = { year: 2026, month: 10 };
const TODAY = '2026-10-15';

function setup(marks: Mark[] = []) {
  render(
    <ReportScreen
      visibleMonth={OCT}
      onMonthChange={vi.fn()}
      roster={ROSTER}
      index={indexMarks(marks)}
      theme="light"
      today={TODAY}
    />,
  );
  return { user: userEvent.setup() };
}

const cell = (day: string) => screen.getByRole('button', { name: new RegExp(`^${day}`) });

/** Everyone in `ids` says `status` on `day`. */
function say(day: string, ids: string[], status: Mark['status']): Mark[] {
  return ids.map((memberId) => ({ memberId, day, status }));
}

describe('unknown is never mistaken for unavailable', () => {
  const threeYes = ['steve', 'katie', 'mike'];

  it('announces the unanswered count on a thinly-answered date', () => {
    setup(say('2026-10-16', threeYes, 'available'));
    expect(cell('2026-10-16')).toHaveAccessibleName(/3 not answered/);
  });

  it('says nothing about unanswered when the whole band has replied', () => {
    setup([
      ...say('2026-10-16', threeYes, 'available'),
      ...say('2026-10-16', ['fran', 'rob', 'jt'], 'unavailable'),
    ]);
    expect(cell('2026-10-16')).not.toHaveAccessibleName(/not answered/);
  });

  it('gives the two dates the same score but distinguishable descriptions', () => {
    setup([
      ...say('2026-10-16', threeYes, 'available'),
      ...say('2026-10-17', threeYes, 'available'),
      ...say('2026-10-17', ['fran', 'rob', 'jt'], 'unavailable'),
    ]);
    expect(cell('2026-10-16')).toHaveAccessibleName(/3 of 6 available/);
    expect(cell('2026-10-17')).toHaveAccessibleName(/3 of 6 available/);
    expect(cell('2026-10-16')).toHaveAccessibleName(/3 not answered/);
    expect(cell('2026-10-17')).not.toHaveAccessibleName(/not answered/);
  });
});

describe('scoring on screen', () => {
  it('counts a maybe as half and shows it as a fraction', () => {
    setup([
      ...say('2026-10-16', ['steve', 'katie', 'mike'], 'available'),
      ...say('2026-10-16', ['fran'], 'maybe'),
    ]);
    expect(cell('2026-10-16')).toHaveAccessibleName(/3½ of 6 available/);
  });

  it('shows zero for a date nobody is free on', () => {
    setup(say('2026-10-16', ROSTER.map((m) => m.id), 'unavailable'));
    expect(cell('2026-10-16')).toHaveAccessibleName(/0 of 6 available/);
  });
});

describe('the detail panel', () => {
  it('defaults to today when today is in the visible month', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Thursday, October 15' })).toBeInTheDocument();
  });

  it('follows the date you tap', async () => {
    const { user } = setup();
    await user.click(cell('2026-10-23'));
    expect(screen.getByRole('heading', { name: 'Friday, October 23' })).toBeInTheDocument();
  });

  it('names everyone, including the ones who said nothing', async () => {
    const { user } = setup([
      ...say('2026-10-23', ['steve'], 'available'),
      ...say('2026-10-23', ['katie'], 'unavailable'),
      ...say('2026-10-23', ['mike'], 'maybe'),
    ]);
    await user.click(cell('2026-10-23'));
    for (const member of ROSTER) {
      expect(screen.getByText(member.name)).toBeInTheDocument();
    }
    expect(screen.getByText(/3 of 6 haven’t answered for this date/)).toBeInTheDocument();
  });

  it('spells out each person\'s status for a screen reader', async () => {
    const { user } = setup([...say('2026-10-23', ['mike'], 'maybe')]);
    await user.click(cell('2026-10-23'));
    // Five silent members plus the grid cell's own description.
    expect(screen.getAllByText('No answer yet').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('Maybe')).toBeInTheDocument();
  });
});
