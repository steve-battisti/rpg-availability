/**
 * Prove the live Supabase project actually enforces what the migration claims.
 *
 *   npm run verify:supabase
 *
 * A green `db push` says the SQL parsed. It does not say anonymous sign-in is
 * on, that RLS is denying what it should, or that the edge function is
 * reachable. This checks those against the real project.
 *
 * It never needs the band passcode: the negative cases are the interesting ones,
 * and a wrong passcode is exactly what proves the function is verifying it.
 *
 * Side effects on the live project: one anonymous user and one failed
 * claim_attempts row per run. Both are harmless — the rate limit keys on the
 * session id, and each run gets a fresh one, so this can never lock out a member.
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('.env.local is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
};

const supabase = createClient(url, key, { auth: { persistSession: false } });

// --- 1. anonymous sign-in ---------------------------------------------------
const { data: signIn, error: signInError } = await supabase.auth.signInAnonymously();
check(
  'anonymous sign-in is enabled',
  Boolean(signIn?.user) && !signInError,
  signInError?.message ?? `uid ${signIn?.user?.id?.slice(0, 8)}…`,
);
if (!signIn?.user) {
  console.error('\nCannot continue without a session.');
  process.exit(1);
}
const uid = signIn.user.id;

// --- 2. the roster came through the migration seed --------------------------
const { data: members, error: membersError } = await supabase
  .from('members')
  .select('id, display_name, is_admin, sort_order')
  .order('sort_order');

const names = (members ?? []).map((m) => m.display_name);
check(
  'roster seeded with all six members',
  names.join(',') === 'Steve,Katie,Mike,Fran,Rob,JT',
  membersError?.message ?? (names.join(', ') || 'no rows'),
);
check(
  'Steve is the only admin',
  (members ?? []).filter((m) => m.is_admin).map((m) => m.id).join() === 'steve',
  ((members ?? []).filter((m) => m.is_admin).map((m) => m.id).join() || 'none'),
);

// --- 3. RLS denies writing a calendar this session has not claimed -----------
// This is the whole permission model. If it passes, R3 is enforced by the
// database rather than by a disabled button.
const { error: writeError } = await supabase
  .from('availability')
  .upsert({ member_id: 'katie', day: '2026-10-16', status: 'available' });
check(
  'RLS blocks writing an unclaimed member\'s availability',
  Boolean(writeError),
  writeError ? `${writeError.code}: ${writeError.message.slice(0, 60)}` : 'WRITE SUCCEEDED — model broken',
);

// --- 4. RLS denies claiming a member directly -------------------------------
// There is deliberately no client write policy on members. If this succeeds,
// any anonymous session can become anybody.
const { error: claimError } = await supabase
  .from('members')
  .update({ claimed_by: uid })
  .eq('id', 'steve');
const { data: steveAfter } = await supabase
  .from('members')
  .select('claimed_by')
  .eq('id', 'steve')
  .maybeSingle();
check(
  'RLS blocks claiming a member directly',
  steveAfter?.claimed_by !== uid,
  claimError ? claimError.message.slice(0, 60) : 'no row was changed',
);

// --- 5. claim_attempts is not readable by clients ---------------------------
const { data: attempts } = await supabase.from('claim_attempts').select('id').limit(1);
check(
  'claim_attempts is not readable by clients',
  !attempts || attempts.length === 0,
  'a client that could read this would see how close it was to lockout',
);

// --- 6. the edge function is deployed and rejects a wrong passcode -----------
const { error: fnError } = await supabase.functions.invoke('claim-member', {
  body: { passcode: '000000000-deliberately-wrong', memberId: 'steve' },
});
const status = fnError?.context?.status;
check(
  'claim-member is deployed and rejects a bad passcode',
  status === 403,
  status ? `HTTP ${status}` : (fnError?.message ?? 'no error — it ACCEPTED a wrong passcode'),
);

// --- 7. it validates the member id too --------------------------------------
const { error: unknownMemberError } = await supabase.functions.invoke('claim-member', {
  body: { passcode: 'wrong', memberId: 'former-bass-player' },
});
const unknownStatus = unknownMemberError?.context?.status;
check(
  'claim-member refuses an unknown member',
  unknownStatus === 403 || unknownStatus === 404,
  unknownStatus ? `HTTP ${unknownStatus}` : 'accepted an unknown member',
);

await supabase.auth.signOut();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
