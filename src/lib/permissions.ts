/**
 * Who may edit whose availability.
 *
 * This is domain policy, not data access, so it lives here and stays testable
 * without a database. It is also **not** the enforcement point: the same rule is
 * a row-level security policy in `supabase/migrations/0001_init.sql`, and that
 * is the one that actually stops anybody. This exists so the UI can disable a
 * control rather than let someone tap it and watch the write bounce.
 */

import type { Member, MemberId } from './availability';

/** R3: a member edits their own dates; the administrator edits anyone's. */
export function canEdit(actor: Member | null, targetId: MemberId): boolean {
  if (!actor) return false;
  return actor.isAdmin || actor.id === targetId;
}

/** Whose calendars this member may open for editing, in roster order. */
export function editableMembers(
  actor: Member | null,
  roster: readonly Member[],
): Member[] {
  if (!actor) return [];
  return roster.filter((m) => canEdit(actor, m.id));
}
