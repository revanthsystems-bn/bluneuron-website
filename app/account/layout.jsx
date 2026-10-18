import { redirect } from 'next/navigation';
import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import AccountGuard from '@/components/account/AccountGuard';
import AccountNav from '@/components/account/AccountNav';
import DemoNotice from '@/components/account/DemoNotice';
import { DEMO_MODE } from '@/lib/supabase/config';
import { getServerUser } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/routes';
import AccountsDisabled from '@/components/account/AccountsDisabled';
import { ACCOUNTS_ENABLED } from '@/lib/site-config';

/**
 * The account area's chrome: heading, section nav, guard — written once so
 * the four pages are only their own content.
 *
 * A LAYOUT RATHER THAN A SHARED COMPONENT each page imports, because the nav
 * must not re-mount when you move between sections: re-mounting resets the
 * horizontal scroll position of the pill row on a phone, so tapping the
 * fourth section would scroll the nav back to the first.
 *
 * Every child page carries `robots: routeRobots(...)` of its own. Metadata
 * does not inherit usefully from a layout for this — a layout's `robots`
 * would be replaced, not merged, by any page that sets its own title.
 */
/**
 * THE GUARD IS HERE, ON THE SERVER, and this is the only one that counts.
 *
 * `getServerUser()` validates the session cookie with Supabase before this
 * layout renders, so a signed-out visitor is redirected before any account
 * markup is produced — no flash of someone else's chrome, and nothing to
 * read in the HTML. components/account/AccountGuard still exists for the
 * client-side loading state; it is a convenience, not a boundary.
 *
 * Reading cookies makes these routes DYNAMIC rather than prerendered, which
 * is correct: an account page is per-visitor by definition and must never be
 * cached at the edge.
 *
 * NOT MIDDLEWARE, deliberately. On Cloudflare Workers via OpenNext,
 * middleware is a separately bundled function with its own constraints and
 * no Node runtime; a server component reading `cookies()` is plain Next.js
 * and behaves identically on Workers, Vercel and `next start`.
 *
 * The REAL protection is still Row Level Security. This guard decides
 * whether to render a page; Postgres decides which rows anyone can read, and
 * it would hold even if this check were removed entirely.
 */
export default async function AccountLayout({ children }) {
  /*
   * ACCOUNTS ARE OFF (ACCOUNTS_ENABLED, lib/site-config), so the whole
   * area answers with one page instead of its children.
   *
   * Gating in the LAYOUT covers /account and all three sub-routes from a
   * single place, and it short-circuits ABOVE the session check below —
   * which matters: with accounts off there is no way to sign in, so the
   * redirect to /sign-in would bounce a visitor to a page that is itself
   * disabled. Nothing below this line runs.
   */
  if (!ACCOUNTS_ENABLED) {
    return (
      <PageShell>
        <section className="bg-black section-y">
          <div className="section-container">
            <AccountsDisabled />
          </div>
        </section>
      </PageShell>
    );
  }

  // Demo mode has no session to check and exists precisely so these screens
  // can be reviewed without a backend.
  if (!DEMO_MODE) {
    const user = await getServerUser();
    if (!user) redirect(ROUTES.signIn);
  }

  return (
    <PageShell>
      <PageHeading
        eyebrow="Account"
        title="Your account."
        subtitle="Registered products, warranty dates, saved addresses and the claims you have raised."
      />

      <section className="bg-black py-12 sm:py-16">
        <div className="section-container">
          <DemoNotice className="mb-10" />

          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:items-start">
            {/* `lg:sticky` on the rail, not on the content: the sections are
                short enough that the rail is the thing worth keeping on
                screen while a long product list scrolls. */}
            <div className="lg:sticky lg:top-28">
              <AccountNav />
            </div>

            <div className="min-w-0">
              <AccountGuard>{children}</AccountGuard>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
