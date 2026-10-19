'use client';

import dynamic from 'next/dynamic';
import { ACCOUNTS_ENABLED } from '@/lib/site-config';

/**
 * Mounts AccountProvider only when accounts are switched on — and, crucially,
 * only DOWNLOADS it then.
 *
 * ---------------------------------------------------------------------
 * WHY THIS FILE EXISTS AT ALL, rather than a ternary in app/layout.jsx.
 *
 * AccountContext is the one module on the site that imports the Supabase
 * browser client: 238KB of JavaScript uncompressed. With accounts off it has
 * no caller — components/account/AccountButton returns null before it reaches
 * the hook, and /sign-in and every /account route render AccountsDisabled —
 * so none of that code can run. It was still being downloaded by every
 * visitor to every page, including a homepage with no account affordance on
 * it anywhere.
 *
 * Two attempts did NOT fix that, and both look like they should:
 *
 *   1. `if (!ACCOUNTS_ENABLED) return children` around a statically imported
 *      provider. A runtime branch does not remove a build-time import; the
 *      module is still in the graph and still in the bundle.
 *   2. `next/dynamic` in app/layout.jsx. The layout is a Server Component, so
 *      `ssr: false` is rejected there — and without it, Next still lists the
 *      module among the route's client chunks and preloads it. Measured: the
 *      238KB chunk was still requested on the homepage.
 *
 * A CLIENT component is what makes `ssr: false` legal, and `ssr: false` is
 * what actually keeps the module out of the initial payload: the import
 * expression only runs if something renders <AccountProvider>, and nothing
 * does while the flag is false.
 *
 * ---------------------------------------------------------------------
 * `children` is server-rendered content passed through as a prop, so putting
 * a client component here does NOT turn the page tree into client components.
 * This file renders no markup of its own in either branch.
 *
 * Flip ACCOUNTS_ENABLED and the provider is back exactly where it was, one
 * lazy chunk later — which, on the pages that need it, is a chunk being
 * fetched in parallel with a route the visitor has deliberately navigated to.
 */
const AccountProvider = dynamic(
  () => import('./AccountContext').then((m) => m.AccountProvider),
  { ssr: false }
);

export default function AccountProviderGate({ children }) {
  if (!ACCOUNTS_ENABLED) return children;
  return <AccountProvider>{children}</AccountProvider>;
}
