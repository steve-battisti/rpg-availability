import { describe, expect, it } from 'vitest';
import { canEdit, editableMembers } from './permissions';
import { ROSTER } from './roster';

const steve = ROSTER.find((m) => m.isAdmin)!;
const katie = ROSTER.find((m) => m.id === 'katie')!;

describe('canEdit', () => {
  it('lets a member edit themselves', () => {
    expect(canEdit(katie, 'katie')).toBe(true);
  });

  it('stops a member editing anyone else', () => {
    for (const other of ROSTER.filter((m) => m.id !== katie.id)) {
      expect(canEdit(katie, other.id)).toBe(false);
    }
  });

  it('lets the admin edit everyone, themselves included', () => {
    for (const member of ROSTER) {
      expect(canEdit(steve, member.id)).toBe(true);
    }
  });

  it('refuses a signed-out visitor', () => {
    expect(canEdit(null, 'katie')).toBe(false);
    expect(canEdit(null, 'steve')).toBe(false);
  });

  it('refuses an unknown target for a non-admin', () => {
    expect(canEdit(katie, 'former-bass-player')).toBe(false);
  });
});

describe('editableMembers', () => {
  it('gives a member only themselves', () => {
    expect(editableMembers(katie, ROSTER).map((m) => m.id)).toEqual(['katie']);
  });

  it('gives the admin the whole roster in order', () => {
    expect(editableMembers(steve, ROSTER).map((m) => m.id)).toEqual(
      ROSTER.map((m) => m.id),
    );
  });

  it('gives a signed-out visitor nobody', () => {
    expect(editableMembers(null, ROSTER)).toEqual([]);
  });
});
