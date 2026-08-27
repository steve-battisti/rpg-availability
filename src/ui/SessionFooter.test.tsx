import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionFooter } from './SessionFooter';

function setup(isAdmin = false) {
  const onSignOut = vi.fn();
  render(<SessionFooter name="Mike" isAdmin={isAdmin} onSignOut={onSignOut} />);
  return { onSignOut, user: userEvent.setup() };
}

describe('who you are', () => {
  it('names the signed-in member', () => {
    setup();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent('Signed in as Mike');
  });

  it('marks the admin', () => {
    setup(true);
    expect(screen.getByText(/Signed in as/)).toHaveTextContent('Admin');
  });

  it('does not call anyone else an admin', () => {
    setup(false);
    expect(screen.getByText(/Signed in as/)).not.toHaveTextContent('Admin');
  });
});

describe('the way out', () => {
  it('offers an escape from the wrong name', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Not you?' })).toBeInTheDocument();
  });

  it('confirms before signing out, because a mis-tap costs the passcode', async () => {
    const { onSignOut, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Not you?' }));
    expect(onSignOut).not.toHaveBeenCalled();
    expect(screen.getByText(/Sign out and pick a different name/)).toBeInTheDocument();
    expect(screen.getByText(/need the mission code again/)).toBeInTheDocument();
  });

  it('signs out once confirmed', async () => {
    const { onSignOut, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Not you?' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('backs out cleanly', async () => {
    const { onSignOut, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Not you?' }));
    await user.click(screen.getByRole('button', { name: 'Stay signed in' }));
    expect(onSignOut).not.toHaveBeenCalled();
    expect(screen.getByText(/Signed in as/)).toBeInTheDocument();
  });
});
