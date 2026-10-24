'use client';

import { createBrowserClient } from '@supabase/ssr';
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * The browser Supabase client — one instance, created lazily.
 *
 * `createBrowserClient` from @supabase/ssr rather than `createClient` from
 * supabase-js, and the difference is the whole reason this file exists: the
 * ssr variant stores the session in COOKIES instead of localStorage, which
 * is what lets a server component read it. The account area is guarded on
 * the server (app/account/layout.jsx); a session kept in localStorage is
 * invisible there, so the guard could only ever have run in the browser —
 * which is not a guard.
 *
 * LAZY, AND MEMOISED. Creating it at module scope would run on import even
 * in demo mode, where the URL and key are empty strings and the constructor
 * throws. Memoised because every `createBrowserClient` call opens its own
 * auth listener, and several components ask for a client.
 *
 * Returns `null` in demo mode. Every caller checks, and that check is the
 * demo-mode branch rather than an error path — there is no backend, which is
 * a supported state, not a failure.
 */
let cached = null;

export function getSupabaseBrowserClient() {
  if (DEMO_MODE) return null;
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
