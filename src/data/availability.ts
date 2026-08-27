/**
 * Reading and writing availability.
 *
 * Rows exist only for marked days. Clearing a date deletes its row rather than
 * storing a null status, so "no answer" has exactly one representation in the
 * database and cannot drift out of step with the domain's unknown state.
 */

import type { Mark, MemberId, Status } from '../lib/availability';
import type { Day } from '../lib/day';
import { supabase } from './supabase';

interface AvailabilityRow {
  member_id: string;
  day: string;
  status: Status;
}

function toMark(row: AvailabilityRow): Mark {
  return { memberId: row.member_id, day: row.day, status: row.status };
}

/**
 * Every mark in a date range, for the whole band.
 *
 * Both ends inclusive. The band is six people over six months — about 1,100
 * rows at absolute worst — so there is no paging here and no need for any.
 */
export async function fetchMarks(from: Day, to: Day): Promise<Mark[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('member_id, day, status')
    .gte('day', from)
    .lte('day', to);
  if (error) throw new Error(`Could not load availability: ${error.message}`);
  return (data as AvailabilityRow[]).map(toMark);
}

/**
 * Set one member's status on a run of days, or clear them.
 *
 * A single call so bulk marking is one round trip: the design's "mark rest of
 * month free" can touch thirty-one dates, and thirty-one requests would make a
 * one-tap action feel like anything but.
 */
export async function setStatus(
  memberId: MemberId,
  days: readonly Day[],
  status: Status | null,
): Promise<void> {
  if (days.length === 0) return;

  if (status === null) {
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('member_id', memberId)
      .in('day', days as string[]);
    if (error) throw new Error(`Could not clear those dates: ${error.message}`);
    return;
  }

  const { data: session } = await supabase.auth.getSession();
  const rows = days.map((day) => ({
    member_id: memberId,
    day,
    status,
    updated_at: new Date().toISOString(),
    updated_by: session.session?.user.id ?? null,
  }));

  const { error } = await supabase
    .from('availability')
    .upsert(rows, { onConflict: 'member_id,day' });
  if (error) throw new Error(`Could not save those dates: ${error.message}`);
}

/**
 * Watch for changes from other members.
 *
 * The band compares notes in real time — someone marking a date on their phone
 * should show up on the report someone else is already looking at. Returns an
 * unsubscribe function.
 */
export function watchAvailability(onChange: () => void): () => void {
  const channel = supabase
    .channel('availability-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
