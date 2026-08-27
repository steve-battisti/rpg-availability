/**
 * Identity: passcode → anonymous session → claimed member row.
 *
 * The passcode is never verified here. This module sends it to the
 * `claim-member` edge function and believes nothing about the answer that the
 * database will not also enforce. A client-side passcode check would be
 * theatre — the bundle is public and anyone can skip it.
 */

import type { Member, MemberId } from '../lib/availability';
import { supabase } from './supabase';

interface MemberRow {
  id: string;
  display_name: string;
  is_admin: boolean;
  sort_order: number;
  claimed_by: string | null;
}

function toMember(row: MemberRow): Member {
  return { id: row.id, name: row.display_name, isAdmin: row.is_admin };
}

/** Sign in anonymously if this browser has no session yet. Idempotent. */
export async function ensureSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;

  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.user) {
    throw new Error(`Could not start a session: ${error?.message ?? 'unknown error'}`);
  }
  return created.user.id;
}

/** The whole band, in the order the design lays them out. */
export async function fetchRoster(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, display_name, is_admin, sort_order, claimed_by')
    .order('sort_order');
  if (error) throw new Error(`Could not load the roster: ${error.message}`);
  return (data as MemberRow[]).map(toMember);
}

/** Which member this browser is signed in as, or null if it has not claimed one. */
export async function currentMember(): Promise<Member | null> {
  const userId = await ensureSession();
  const { data, error } = await supabase
    .from('members')
    .select('id, display_name, is_admin, sort_order, claimed_by')
    .eq('claimed_by', userId)
    .maybeSingle();
  if (error) throw new Error(`Could not read your membership: ${error.message}`);
  return data ? toMember(data as MemberRow) : null;
}

export type ClaimFailure =
  | 'bad_passcode'
  | 'unknown_member'
  | 'too_many_attempts'
  | 'not_signed_in'
  | 'server_error';

export type ClaimResult =
  | { ok: true; member: Member }
  | { ok: false; reason: ClaimFailure; retryAfterMinutes?: number };

/**
 * Claim a member row with the band passcode.
 *
 * Returns a result rather than throwing, because "wrong passcode" and "locked
 * out for 15 minutes" are things the Entry screen has to say out loud, not
 * exceptions to swallow.
 */
export async function claimMember(passcode: string, memberId: MemberId): Promise<ClaimResult> {
  await ensureSession();

  const { data, error } = await supabase.functions.invoke('claim-member', {
    body: { passcode, memberId },
  });

  if (error) {
    // The function returns a structured reason in its body on 4xx; the client
    // surfaces that as a FunctionsHttpError with the response attached.
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 403) return { ok: false, reason: 'bad_passcode' };
    if (status === 404) return { ok: false, reason: 'unknown_member' };
    if (status === 401) return { ok: false, reason: 'not_signed_in' };
    if (status === 429) return { ok: false, reason: 'too_many_attempts', retryAfterMinutes: 15 };
    return { ok: false, reason: 'server_error' };
  }

  if (!data || typeof data.memberId !== 'string') {
    return { ok: false, reason: 'server_error' };
  }

  const member = await currentMember();
  if (!member) return { ok: false, reason: 'server_error' };
  return { ok: true, member };
}
