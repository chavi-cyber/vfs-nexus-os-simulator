import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env');
}

// Use the caller's access token for every request so Supabase RLS remains enforced.
export function createUserDb(accessToken) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

// Used only to verify access tokens; the publishable key cannot bypass RLS.
export const authClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
