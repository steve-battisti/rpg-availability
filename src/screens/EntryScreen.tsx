/**
 * Entry — band passcode, then pick your name.
 *
 * Shown once. After a successful claim the anonymous session owns a member row
 * and returning visits skip straight to the calendar.
 */

import { useRef, useState } from 'react';
import type { Member } from '../lib/availability';
import { type ClaimFailure, claimMember } from '../data/session';
import { Card } from '../ui/Card';

const CODE_LENGTH = 4;

const FAILURE_COPY: Record<ClaimFailure, string> = {
  bad_passcode: "That code isn't right. Try again.",
  unknown_member: 'That name is not on the roster.',
  too_many_attempts: 'Too many tries. Give it fifteen minutes.',
  not_signed_in: 'Lost the connection. Reload and try again.',
  unreachable: "Couldn't reach the server. Check your connection and try again.",
  server_error: 'Something went wrong. Try again in a moment.',
};

export function EntryScreen({
  roster,
  onClaimed,
}: {
  roster: readonly Member[];
  onClaimed: () => void | Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const codeComplete = code.length === CODE_LENGTH;

  async function pick(member: Member) {
    if (!codeComplete) {
      setMessage('Enter the mission code first.');
      inputRef.current?.focus();
      return;
    }
    setPending(member.id);
    setMessage(null);
    const result = await claimMember(code, member.id);
    setPending(null);
    if (result.ok) {
      await onClaimed();
      return;
    }
    setCode('');
    setMessage(FAILURE_COPY[result.reason]);
  }

  return (
    <Card className="min-h-[70vh]">
      <h1 className="font-display text-[22px] leading-tight text-accent">
        RED PLANET
        <br />
        GROOVE
      </h1>

      <label className="mt-6 block font-body text-[13px] text-ink-muted" htmlFor="mission-code">
        Enter the mission code
      </label>

      {/*
        One real input behind four boxes. This is what gets a phone to show a
        numeric keypad and lets password managers and autofill behave, which four
        separate single-character inputs famously do not.
      */}
      <div
        className="relative mt-2 flex gap-2"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <input
          ref={inputRef}
          id="mission-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          // The first thing anyone does here is type the code, so put the
          // cursor in it rather than making them tap the boxes first.
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH));
            setMessage(null);
          }}
          className="absolute inset-0 h-full w-full opacity-0"
          aria-describedby={message ? 'entry-message' : undefined}
        />
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={`flex h-12 w-10 items-center justify-center rounded-[12px] border-2 font-display text-[22px] ${
              i === code.length ? 'border-accent' : 'border-accent/60'
            }`}
          >
            {code[i] ? '•' : ''}
          </div>
        ))}
      </div>

      <p className="mt-6 font-body text-[13px] text-ink-muted">Who&rsquo;s on the mission?</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {roster.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => void pick(member)}
            disabled={pending !== null}
            className={`min-h-11 rounded-[20px] border-2 px-4 py-3 font-body text-[13px] font-bold disabled:opacity-60 ${
              pending === member.id
                ? 'border-accent bg-available text-available-ink'
                : 'border-border bg-surface text-ink'
            }`}
          >
            {member.name}
            {member.isAdmin ? (
              <span className="ml-1.5 font-normal text-[11px] text-ink-muted">Admin</span>
            ) : null}
          </button>
        ))}
      </div>

      {message ? (
        <p
          id="entry-message"
          role="status"
          className="mt-4 font-body text-[12px] font-bold text-accent"
        >
          {message}
        </p>
      ) : null}

      <p className="mt-auto pt-8 font-body text-[11px] text-ink-muted">
        One tap and you&rsquo;re in. Returning members skip this.
      </p>
    </Card>
  );
}
