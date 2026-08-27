import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '../lib/roster';

/**
 * The roster exists twice: as a constant the domain and tests use, and as seed
 * rows in the migration. Two copies of the same six people is exactly the kind
 * of thing that silently drifts, so this parses the SQL and compares.
 */
const SQL = readFileSync('supabase/migrations/0001_init.sql', 'utf8');

function seededMembers(): { id: string; name: string; isAdmin: boolean; sort: number }[] {
  const block = /insert into members \(id, display_name, is_admin, sort_order\) values([\s\S]*?);/.exec(
    SQL,
  );
  if (!block) throw new Error('Could not find the members seed block in the migration');
  const rows = [...block[1]!.matchAll(/\('([^']+)',\s*'([^']+)',\s*(true|false),\s*(\d+)\)/g)];
  return rows.map((m) => ({
    id: m[1]!,
    name: m[2]!,
    isAdmin: m[3] === 'true',
    sort: Number(m[4]),
  }));
}

describe('migration seed matches the roster constant', () => {
  const seeded = seededMembers();

  it('seeds the same six people', () => {
    expect(seeded.map((m) => m.id)).toEqual(ROSTER.map((m) => m.id));
    expect(seeded.map((m) => m.name)).toEqual(ROSTER.map((m) => m.name));
  });

  it('agrees on who the admin is', () => {
    expect(seeded.filter((m) => m.isAdmin).map((m) => m.id)).toEqual(
      ROSTER.filter((m) => m.isAdmin).map((m) => m.id),
    );
  });

  it('seeds sort_order in roster order', () => {
    expect(seeded.map((m) => m.sort)).toEqual(ROSTER.map((_, i) => i));
  });
});

describe('migration safety rails', () => {
  it('enables row level security on every table it creates', () => {
    const created = [...SQL.matchAll(/create table (\w+)/g)].map((m) => m[1]!);
    expect(created.length).toBeGreaterThan(0);
    for (const table of created) {
      expect(SQL).toContain(`alter table ${table} enable row level security`);
    }
  });

  it('grants availability writes only to the owning member or the admin', () => {
    expect(SQL).toContain(
      'using (member_id = public.claimed_member_id() or public.is_band_admin())',
    );
    expect(SQL).toContain(
      'with check (member_id = public.claimed_member_id() or public.is_band_admin())',
    );
  });

  it('never grants clients a write policy on members', () => {
    // Claiming goes through the edge function. If a policy appears here that
    // lets the client write members, anyone could claim anyone.
    const memberWritePolicy = /create policy \w+ on members\s+for (insert|update|delete|all)/;
    expect(memberWritePolicy.test(SQL)).toBe(false);
  });
});
