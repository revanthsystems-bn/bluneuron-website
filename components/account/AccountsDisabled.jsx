import Link from 'next/link';
import { LifeBuoy, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

/**
 * What /sign-in and every /account route render while ACCOUNTS_ENABLED is
 * false (lib/site-config).
 *
 * THE POINT OF THIS PAGE IS THE TWO LINKS, not the apology. Someone who
 * lands here almost always arrived wanting one of two things — to register
 * a product for warranty, or to claim on it — and both of those work
 * TODAY, as guest forms, with no account involved. Telling them "coming
 * soon" and stopping would send a customer with a faulty unit away from
 * the page that would have helped them.
 *
 * So the copy names what is missing in one line and spends the rest of the
 * page on what is not. The QR code printed on the IRIZ carton points at
 * /warranty, which is exactly this journey.
 *
 * A server component: it is static text and two links, and shipping
 * JavaScript for it would be absurd.
 */
export default function AccountsDisabled() {
  return (
    <div className="mx-auto max-w-prose-wide text-center">
      <p className="eyebrow">Accounts</p>

      <h1 className="h2 mt-4">Accounts are coming soon.</h1>

      <p className="mt-5 text-step-3 text-ink-2">
        We haven&rsquo;t opened BluNeuron accounts yet. Nothing on the site needs one
        today &mdash; you can buy, register a product and make a warranty claim
        without signing in.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.warrantyRegistration}
          className="group rounded-card border border-border-subtle bg-black-surface/60 p-6 text-left transition-colors duration-base ease-brand hover:border-border-strong hover:bg-black-elevated"
        >
          <ShieldCheck
            className="h-5 w-5 text-accent-soft"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="mt-4 text-step-4 font-semibold text-ink">Register your IRIZ</p>
          <p className="mt-2 text-step-2 text-ink-3">
            Takes a minute, no account needed. Keeps your warranty on file.
          </p>
        </Link>

        <Link
          href={ROUTES.warrantyClaim}
          className="group rounded-card border border-border-subtle bg-black-surface/60 p-6 text-left transition-colors duration-base ease-brand hover:border-border-strong hover:bg-black-elevated"
        >
          <LifeBuoy
            className="h-5 w-5 text-accent-soft"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="mt-4 text-step-4 font-semibold text-ink">Make a warranty claim</p>
          <p className="mt-2 text-step-2 text-ink-3">
            Already registered, or have your invoice? Start a claim here.
          </p>
        </Link>
      </div>

      <p className="mt-10 text-step-2 text-ink-3">
        Need something else?{' '}
        <Link
          href={ROUTES.contact}
          className="text-ink underline decoration-border-strong underline-offset-4 transition-colors duration-base ease-brand hover:decoration-accent-soft"
        >
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
