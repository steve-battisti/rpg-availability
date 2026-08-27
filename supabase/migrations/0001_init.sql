-- Red Planet Groove — availability schema.
--
-- Permission model, stated once here because everything below follows from it:
--
--   Identity is a Supabase *anonymous* session. On first visit a member enters
--   the shared band passcode and picks their name; an edge function verifies the
--   passcode server-side and writes that session's uid onto their member row.
--   From then on the database — not the UI — enforces "you may only edit your
--   own availability", by comparing auth.uid() to members.claimed_by.
--
--   The passcode is never checked in the browser. A client-side check is
--   decoration: anyone can skip it. The only thing standing between an
--   anonymous session and someone else's calendar is RLS.

create type availability_status as enum ('available', 'unavailable', 'maybe');

-- ---------------------------------------------------------------- members --

create table members (
  id           text primary key,
  display_name text not null,
  is_admin     boolean not null default false,
  sort_order   integer not null,
  -- The anonymous auth session that currently "is" this member. Null until
  -- someone claims it. Unique: one session cannot be two members.
  claimed_by   uuid unique references auth.users (id) on delete set null,
  claimed_at   timestamptz
);

comment on column members.claimed_by is
  'Anonymous auth session that owns this member. Written only by the claim-member edge function.';

-- ----------------------------------------------------------- availability --

create table availability (
  member_id  text not null references members (id) on delete cascade,
  day        date not null,
  status     availability_status not null,
  updated_at timestamptz not null default now(),
  -- Who actually made the change. Differs from the member when the admin edits
  -- someone else's calendar, which is exactly when you want to know.
  updated_by uuid references auth.users (id) on delete set null,
  primary key (member_id, day)
);

-- There is no row for an unmarked date. A missing row means "no answer", which
-- is a different thing from "unavailable" and must never be conflated with it.
comment on table availability is
  'Only marked days have rows. A missing row means the member has not answered.';

create index availability_day_idx on availability (day);

-- --------------------------------------------------------- claim attempts --

-- Backs rate limiting in the claim-member edge function. A 4-digit passcode is
-- 10,000 guesses; throttling is what makes that number mean anything.
create table claim_attempts (
  id        bigserial primary key,
  actor     text not null,
  succeeded boolean not null,
  at        timestamptz not null default now()
);

create index claim_attempts_actor_at_idx on claim_attempts (actor, at desc);

-- ------------------------------------------------------------- helpers ----

-- The member this session has claimed, or null. SECURITY DEFINER so it can read
-- members regardless of the caller's own RLS view; STABLE so the planner may
-- call it once per statement rather than once per row.
create or replace function public.claimed_member_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from members where claimed_by = auth.uid()
$$;

create or replace function public.is_band_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from members where claimed_by = auth.uid()), false)
$$;

-- ------------------------------------------------------------------ RLS ---

alter table members enable row level security;
alter table availability enable row level security;
alter table claim_attempts enable row level security;

-- Everyone signed in can see the whole roster and the whole calendar. That is
-- the point of the app: six people comparing notes.
create policy members_read on members
  for select to authenticated using (true);

create policy availability_read on availability
  for select to authenticated using (true);

-- Writes are the member's own, or anyone's if you are the admin.
create policy availability_write_own on availability
  for all to authenticated
  using (member_id = public.claimed_member_id() or public.is_band_admin())
  with check (member_id = public.claimed_member_id() or public.is_band_admin());

-- No insert/update/delete policy on members, so RLS denies all of it. Claiming
-- goes through the edge function, which uses the service role and bypasses RLS
-- only after it has verified the passcode.
--
-- Likewise no policy on claim_attempts: only the edge function touches it, and
-- a client that could read it would learn how close it was to the lockout.

-- ------------------------------------------------------------------ seed --

-- The roster is fixed. Adding a member is a migration, not a feature.
-- Kept in sync with src/lib/roster.ts by src/data/seed.test.ts.
insert into members (id, display_name, is_admin, sort_order) values
  ('steve', 'Steve', true,  0),
  ('katie', 'Katie', false, 1),
  ('mike',  'Mike',  false, 2),
  ('fran',  'Fran',  false, 3),
  ('rob',   'Rob',   false, 4),
  ('jt',    'JT',    false, 5);
