/**
 * The Supabase client.
 *
 * The anon key is public by design — it is shipped in the bundle and grants
 * nothing on its own. Every permission in this app is a row-level security
 * policy in `supabase/migrations/0001_init.sql`, not a secret held by the
 * client. If something here looks under-defended, the defence is in the
 * database.
 */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill it in.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // The anonymous session *is* the "name in a cookie" the band asked for, so
    // it has to survive closing the tab and come back on its own.
    persistSession: true,
    autoRefreshToken: true,
  },
});
