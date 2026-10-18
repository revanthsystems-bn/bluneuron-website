/**
 * Supabase configuration, and the one decision every other file reads:
 * is there a backend at all?
 *
 * TWO VALUES, BOTH `NEXT_PUBLIC_`, AND THAT IS CORRECT. The anon /
 * publishable key is a BROWSER credential by design — it is in the page
 * source of every site that uses Supabase, and it is not what protects the
 * data. Row Level Security is. A policy on every table restricts each row to
 * the user who owns it, enforced by Postgres, so a key in the page source
 * grants exactly the access an anonymous visitor is supposed to have and
 * nothing more.
 *
 * THE SERVICE ROLE KEY IS A DIFFERENT THING ENTIRELY and does not appear in
 * this repository. It bypasses RLS completely. It must never be prefixed
 * `NEXT_PUBLIC_`, never imported by a client component, and never committed.
 * Nothing in this application needs it: every read and write here is done as
 * the signed-in user, which is what RLS is for. If a future server-only task
 * genuinely needs it (a bulk export, a scheduled cleanup), it belongs in a
 * Cloudflare secret — `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` — read
 * only inside a server route, and the person running that command should be
 * the account owner, not this codebase.
 *
 * BOTH VALUES ARE COMMITTED TO .env.production, deliberately, alongside the
 * Meta Pixel ID and the Web3Forms key — for the reason that file exists:
 * `NEXT_PUBLIC_*` values are inlined by `next build`, so they must be present
 * when the build runs, not when the host starts the app. A committed file is
 * the only version of that which cannot be forgotten, and committing a value
 * that already ships in every visitor's page source leaks nothing.
 *
 * The earlier plan was to keep them out of git so that rotating the key would
 * be a dashboard action and a rebuild rather than a commit. That trade was not
 * worth it: a key the build can silently miss is the larger risk, rotation is
 * rare, and rotating now is simply a commit — nothing here needs a history
 * rewrite, because there is no secret in the history to erase. See
 * docs/supabase-setup.md.
 *
 * What this does NOT license is committing anything whose secrecy matters.
 * The `service_role` key above stays out, and the rule in .env.production
 * stands: public, browser-visible values only.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * DEMO MODE: no backend configured.
 *
 * Both halves are required. A URL without a key, or a key without a URL, is
 * a half-configured build that would fail at the first request rather than
 * at the first render — so it is treated as "no backend", and every account
 * surface renders fixtures with a visible "demo data" notice instead.
 *
 * `scripts/check-production.js` refuses a production deploy while this is
 * true, so demo mode can never be what a customer meets.
 */
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;
