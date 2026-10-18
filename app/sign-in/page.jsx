import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import SignInForm from '@/components/account/SignInForm';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import AccountsDisabled from '@/components/account/AccountsDisabled';
import { ACCOUNTS_ENABLED } from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'Sign in — BluNeuron',
    description: 'Sign in to register a warranty, track your products and raise a claim.',
    path: ROUTES.signIn,
  }),
  robots: routeRobots(ROUTES.signIn),
};

/**
 * /sign-in — noindex, and out of the sitemap (PRIVATE_ROUTES, lib/routes.js).
 *
 * The subtitle says what an account is FOR before asking anyone to make one.
 * "Sign in" with no reason attached is the commonest way to lose someone at
 * this step: there is nothing to buy behind it (the purchase happens on a
 * marketplace), so the only honest pitch is warranty and support.
 */
export default function SignInPage() {
  /*
   * ACCOUNTS ARE OFF (ACCOUNTS_ENABLED, lib/site-config). This renders the
   * same page the /account area does rather than redirecting to it — a
   * redirect would send someone who clicked "Sign in" to a URL they did
   * not ask for, and the page they need to read is identical either way.
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

  return (
    <PageShell>
      <PageHeading
        eyebrow="Account"
        title="Sign in."
        subtitle="An account is for after the purchase — register a unit's warranty, keep your serial numbers in one place, and raise a claim without typing it all out again."
      />

      <section className="bg-black section-y">
        <div className="section-container">
          <SignInForm />
        </div>
      </section>
    </PageShell>
  );
}
