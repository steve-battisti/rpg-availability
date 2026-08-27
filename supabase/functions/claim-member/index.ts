/**
 * claim-member — verify the band passcode and bind this anonymous session to a
 * member row.
 *
 * This runs server-side for one reason: a passcode checked in the browser is
 * decoration. The client can skip it, and the anon key is public. This function
 * is the only thing that ever writes members.claimed_by, and it does so with the
 * service role after the passcode has actually been verified.
 *
 * Deno runtime. Not covered by the app's tsconfig or test suite.
 *
 * Required secrets:
 *   BAND_PASSCODE_SHA256  hex sha-256 of (passcode + BAND_PASSCODE_SALT)
 *   BAND_PASSCODE_SALT    any non-empty random string
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (injected by the platform)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

/** A 4-digit code is only 10,000 guesses. Throttling is what makes it hold. */
const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

/**
 * These must list every header the supabase-js client actually sends, not just
 * the ones this function reads. A browser preflight that asks for a header not
 * named here is rejected before the request is ever sent, and the failure looks
 * like a generic server error from the client side.
 *
 * `x-client-info` and `apikey` are added by supabase-js on every call. Missing
 * them broke browser claims while a Node-based check passed, because Node does
 * not do preflight at all.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare in constant time. Overkill against a remote attacker who cannot
 * measure microseconds, but the habit costs nothing and the alternative is
 * explaining later why it was fine.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const expected = Deno.env.get('BAND_PASSCODE_SHA256') ?? '';
  const salt = Deno.env.get('BAND_PASSCODE_SALT') ?? '';

  if (!expected || !salt) return json({ error: 'server_misconfigured' }, 500);

  // Identify the caller from their JWT, using their own token so we learn who
  // they actually are rather than trusting anything in the body.
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await asCaller.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: 'not_signed_in' }, 401);

  const admin = createClient(url, serviceKey);

  // Rate limit on the session id. An attacker can mint fresh anonymous sessions,
  // so this is a speed bump rather than a wall — but combined with an unlisted
  // URL and six known users it is proportionate. Tighten to IP if it ever gets
  // abused.
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from('claim_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('actor', user.id)
    .eq('succeeded', false)
    .gte('at', since);

  if ((count ?? 0) >= MAX_FAILURES) {
    return json({ error: 'too_many_attempts', retryAfterMinutes: WINDOW_MINUTES }, 429);
  }

  let body: { passcode?: unknown; memberId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const passcode = typeof body.passcode === 'string' ? body.passcode : '';
  const memberId = typeof body.memberId === 'string' ? body.memberId : '';
  if (!passcode || !memberId) return json({ error: 'bad_request' }, 400);

  const ok = timingSafeEqual(await sha256Hex(passcode + salt), expected.toLowerCase());
  if (!ok) {
    await admin.from('claim_attempts').insert({ actor: user.id, succeeded: false });
    return json({ error: 'bad_passcode' }, 403);
  }

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('id', memberId)
    .maybeSingle();
  if (!member) {
    await admin.from('claim_attempts').insert({ actor: user.id, succeeded: false });
    return json({ error: 'unknown_member' }, 404);
  }

  // Release any member this session previously held, so one session is never
  // two members — the unique constraint on claimed_by would reject it anyway,
  // but failing on a constraint is a worse experience than just moving.
  await admin
    .from('members')
    .update({ claimed_by: null, claimed_at: null })
    .eq('claimed_by', user.id);

  // Claiming overwrites whoever held it. Everyone with the passcode is in the
  // band, and this is what makes "sign in on a new phone" work.
  const { error } = await admin
    .from('members')
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
    .eq('id', memberId);

  if (error) return json({ error: 'claim_failed' }, 500);

  await admin.from('claim_attempts').insert({ actor: user.id, succeeded: true });
  return json({ memberId });
});
