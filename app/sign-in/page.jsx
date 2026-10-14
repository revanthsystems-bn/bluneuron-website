import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import SignInForm from '@/components/account/SignInForm';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

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
  return (
    <PageShell>
      <PageHeading
        eyebrow="Account"
        title="Sign in."
        subtitle="An account is for after the purchase — register a unit's warranty, keep your serial numbers in one place, and raise a claim without typing it all out again."
      />

      <section className="bg-black py-14 sm:py-20">
        <div className="section-container">
          <SignInForm />
        </div>
      </section>
    </PageShell>
  );
}
