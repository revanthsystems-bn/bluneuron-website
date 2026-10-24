'use client';

import { useAccount } from './AccountContext';
import { ROUTES } from '@/lib/routes';

/**
 * "Are you allowed to see this?" — the Phase 1 version.
 *
 * WHAT IT DOES TODAY: in DEMO MODE it lets everything through, because the
 * whole point of demo mode is that the account screens can be reviewed
 * without a backend. With a real session it renders the area for a signed-in
 * visitor and a sign-in prompt for everyone else.
 *
 * WHAT IT IS NOT: a security boundary. A client component cannot be one —
 * the markup it guards is already in the bundle, and anyone can read it.
 * That is acceptable precisely because there is nothing behind it yet: the
 * account pages render fixtures from lib/account-demo.js, and no private
 * data exists for this to leak.
 *
 * PHASE 2 MUST ADD THE REAL GUARD, server-side: the session is read in the
 * layout, a signed-out visitor is redirected before any account markup is
 * produced, and Row Level Security in Postgres is what actually keeps one
 * person's rows away from another. This component then becomes a
 * convenience for the loading state and nothing more. Shipping real customer
 * data behind this check alone would be the bug.
 */
export default function AccountGuard({ children }) {
  const { user, hydrated, isDemo } = useAccount();

  if (isDemo) return children;

  // Until localStorage has been read we genuinely do not know. Rendering the
  // prompt here would flash "please sign in" at every signed-in visitor.
  if (!hydrated) return <div className="h-64" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="rounded-3xl border border-border-subtle bg-black-soft px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-white">Sign in to see your account</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
          Your registered products, warranty dates and saved addresses live behind a sign-in.
        </p>
        <a href={ROUTES.signIn} className="btn-primary mt-7 justify-center">
          Sign in
        </a>
      </div>
    );
  }

  return children;
}
