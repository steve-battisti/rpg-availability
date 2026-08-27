import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type Mark, indexMarks } from '../lib/availability';
import { ROSTER } from '../lib/roster';
import { MarkScreen } from './MarkScreen';

const OCT = { year: 2026, month: 10 };
const TODAY = '2026-10-15';
const steve = ROSTER[0]!;
const katie = ROSTER[1]!;

function setup(marks: Mark[] = [], me = katie) {
  const onSetStatus = vi.fn().mockResolvedValue(undefined);
  render(
    <MarkScreen
      visibleMonth={OCT}
      onMonthChange={vi.fn()}
      roster={ROSTER}
      me={me}
      index={indexMarks(marks)}
      today={TODAY}
      onSetStatus={onSetStatus}
    />,
  );
  return { onSetStatus, user: userEvent.setup() };
}

const cell = (day: string) => screen.getByRole('button', { name: new RegExp(`^${day}`) });

describe('tapping a date cycles it', () => {
  it('goes unset → available', async () => {
    const { onSetStatus, user } = setup();
    await user.click(cell('2026-10-16'));
    expect(onSetStatus).toHaveBeenCalledWith(katie.id, ['2026-10-16'], 'available');
  });

  it('goes available → maybe', async () => {
    const { onSetStatus, user } = setup([
      { memberId: katie.id, day: '2026-10-16', status: 'available' },
    ]);
    await user.click(cell('2026-10-16'));
    expect(onSetStatus).toHaveBeenCalledWith(katie.id, ['2026-10-16'], 'maybe');
  });

  it('goes maybe → unavailable', async () => {
    const { onSetStatus, user } = setup([
      { memberId: katie.id, day: '2026-10-16', status: 'maybe' },
    ]);
    await user.click(cell('2026-10-16'));
    expect(onSetStatus).toHaveBeenCalledWith(katie.id, ['2026-10-16'], 'unavailable');
  });

  it('goes unavailable → unset, clearing the row rather than storing a status', async () => {
    const { onSetStatus, user } = setup([
      { memberId: katie.id, day: '2026-10-16', status: 'unavailable' },
    ]);
    await user.click(cell('2026-10-16'));
    expect(onSetStatus).toHaveBeenCalledWith(katie.id, ['2026-10-16'], null);
  });

  it('announces each cell with its state, so the glyph is not the only cue', () => {
    setup([{ memberId: katie.id, day: '2026-10-16', status: 'maybe' }]);
    expect(cell('2026-10-16')).toHaveAccessibleName(/Maybe/);
    expect(cell('2026-10-17')).toHaveAccessibleName(/No answer yet/);
  });
});

describe('mark rest of month free', () => {
  it('never backfills dates that have already passed', async () => {
    const { onSetStatus, user } = setup();
    await user.click(screen.getByRole('button', { name: /Mark rest of month free/ }));
    const days = onSetStatus.mock.calls[0]![1] as string[];
    expect(days[0]).toBe(TODAY);
    expect(days.every((d) => d >= TODAY)).toBe(true);
    expect(days).not.toContain('2026-10-01');
  });

  it('covers today through the end of the month', async () => {
    const { onSetStatus, user } = setup();
    await user.click(screen.getByRole('button', { name: /Mark rest of month free/ }));
    const days = onSetStatus.mock.calls[0]![1] as string[];
    expect(days).toHaveLength(17); // 15th–31st inclusive
    expect(days[days.length - 1]).toBe('2026-10-31');
    expect(onSetStatus.mock.calls[0]![2]).toBe('available');
  });

  it('leaves dates the member has already answered alone', async () => {
    const { onSetStatus, user } = setup([
      { memberId: katie.id, day: '2026-10-20', status: 'unavailable' },
    ]);
    await user.click(screen.getByRole('button', { name: /Mark rest of month free/ }));
    expect(onSetStatus.mock.calls[0]![1]).not.toContain('2026-10-20');
  });

  it('is disabled once nothing is left unset', () => {
    const marks: Mark[] = [];
    for (let d = 15; d <= 31; d++) {
      marks.push({ memberId: katie.id, day: `2026-10-${d}`, status: 'available' });
    }
    setup(marks);
    expect(screen.getByRole('button', { name: /Mark rest of month free/ })).toBeDisabled();
  });
});

describe('bulk marking', () => {
  it('applies one status to every selected date in a single call', async () => {
    const { onSetStatus, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select multiple' }));
    await user.click(cell('2026-10-16'));
    await user.click(cell('2026-10-17'));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark selected unavailable' }));
    expect(onSetStatus).toHaveBeenCalledTimes(1);
    expect(onSetStatus).toHaveBeenCalledWith(
      katie.id,
      ['2026-10-16', '2026-10-17'],
      'unavailable',
    );
  });

  it('does not cycle a cell while selecting it', async () => {
    const { onSetStatus, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select multiple' }));
    await user.click(cell('2026-10-16'));
    expect(onSetStatus).not.toHaveBeenCalled();
  });

  it('lets a tap deselect', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select multiple' }));
    await user.click(cell('2026-10-16'));
    await user.click(cell('2026-10-16'));
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });

  it('leaves bulk mode after applying', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Select multiple' }));
    await user.click(cell('2026-10-16'));
    await user.click(screen.getByRole('button', { name: 'Mark selected available' }));
    expect(screen.getByRole('button', { name: 'Select multiple' })).toBeInTheDocument();
  });
});

describe('who you can edit', () => {
  it('shows no switcher to an ordinary member', () => {
    setup([], katie);
    expect(screen.queryByText('Editing')).not.toBeInTheDocument();
  });

  it('writes an ordinary member\'s own id, never anyone else\'s', async () => {
    const { onSetStatus, user } = setup([], katie);
    await user.click(cell('2026-10-16'));
    expect(onSetStatus.mock.calls[0]![0]).toBe(katie.id);
  });

  it('offers the admin the whole roster', () => {
    setup([], steve);
    const editing = screen.getByText('Editing').parentElement!;
    const names = within(editing)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual(['Me', 'Katie', 'Mike', 'Fran', 'Rob', 'JT']);
  });

  it('writes to the chosen member once the admin switches', async () => {
    const { onSetStatus, user } = setup([], steve);
    await user.click(screen.getByRole('button', { name: 'Mike' }));
    await user.click(cell('2026-10-16'));
    expect(onSetStatus.mock.calls[0]![0]).toBe('mike');
  });

  it('warns the admin they are not editing their own calendar', async () => {
    const { user } = setup([], steve);
    await user.click(screen.getByRole('button', { name: 'Mike' }));
    expect(screen.getByText(/editing Mike’s calendar, not your own/)).toBeInTheDocument();
  });

  it('drops any pending selection when the admin switches member', async () => {
    const { user } = setup([], steve);
    await user.click(screen.getByRole('button', { name: 'Select multiple' }));
    await user.click(cell('2026-10-16'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mike' }));
    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });
});
