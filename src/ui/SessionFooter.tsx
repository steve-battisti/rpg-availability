import { useState } from 'react';

/**
 * Who you are, and the way out.
 *
 * Six people share one passcode and pick from a row of six names, so somebody
 * will eventually tap the wrong one. Without this they are that person on that
 * phone permanently, marking someone else's calendar, with no recourse short of
 * clearing site data.
 *
 * Signing out is confirmed rather than immediate: it costs re-entering the
 * passcode, which is a mean thing to inflict on a mis-tap.
 */
export function SessionFooter({
  name,
  isAdmin,
  onSignOut,
}: {
  name: string;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-2 pb-2">
        <p className="font-body text-[12px] text-ink">
          Sign out and pick a different name?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="min-h-11 rounded-[20px] border-2 border-accent bg-surface px-4 py-2 font-body text-[13px] font-bold text-accent"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-11 rounded-[20px] border-2 border-border bg-surface px-4 py-2 font-body text-[13px] font-bold text-ink"
          >
            Stay signed in
          </button>
        </div>
        <p className="font-body text-[11px] text-ink-muted">
          You&rsquo;ll need the mission code again.
        </p>
      </div>
    );
  }

  return (
    <p className="pb-2 text-center font-body text-[11px] text-ink-muted">
      Signed in as {name}
      {isAdmin ? ' · Admin' : ''}
      {' · '}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-11 font-body text-[11px] font-bold text-accent underline"
      >
        Not you?
      </button>
    </p>
  );
}
