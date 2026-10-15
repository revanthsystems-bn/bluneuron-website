import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * The server Supabase client, for reading the session inside a server
 * component.
 *
 * WHY THIS IS NOT MIDDLEWARE. The obvious place to guard /account/* is
 * `middleware.js`, and that is deliberately not what this project does: the
 * site runs on Cloudflare Workers through OpenNext, where middleware is a
 * separately bundled function with its own runtime constraints, and a Node
 * middleware is not an option at all. A server component reading `cookies()`
 * is plain Next.js, works identically on Workers, Vercel and `next start`,
 * and has no second bundle to keep in sync.
 *
 * READ-ONLY, AND THAT IS NOT A LIMITATION HERE. `cookies()` in a server
 * COMPONENT cannot write — only a route handler or a server action can — so
 * `setAll` is a deliberate no-op. The browser client owns the session: it
 * refreshes the token and writes the cookie from the client side, and this
 * only ever reads what is already there. Supabase's own guidance calls this
 * out, and swallowing the write here is what it recommends rather than
 * letting Next throw on every render.
 *
 * In demo mode it returns null, same contract as the browser client.
 */
export async function getSupabaseServerClient() {
  if (DEMO_MODE) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Intentionally empty. See the note above: a server component cannot
        // set cookies, and the browser client is what keeps the session
        // fresh. Throwing here would break every account page render.
      },
    },
  });
}

/**
 * The signed-in user, or null.
 *
 * `getUser()` and NOT `getSession()`. `getSession()` returns whatever is in
 * the cookie without checking it, so a forged or stale cookie would read as
 * a valid session on the server — which is precisely the check this function
 * exists to make. `getUser()` validates the token with Supabase before
 * answering. On a page that decides whether to show someone's warranty
 * records, that difference is the whole security boundary.
 */
export async function getServerUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}
