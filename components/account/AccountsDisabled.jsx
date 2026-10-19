import { ROUTES } from '@/lib/routes';

/**
 * What /sign-in and every /account route render while ACCOUNTS_ENABLED is
 * false (lib/site-config).
 *
 * A FRIENDLY PANEL, NOT A 404. The routes still exist, the account system
 * still works, and someone who followed an old link or a bookmark has not
 * done anything wrong — they have arrived early. A 404 would say the page is
 * gone, which is untrue, and would offer them nothing.
 *
 * WHAT IT HAS TO DO, beyond apologising: send people to the thing they were
 * almost certainly here for. Nearly every reason to want an account on this
 * site is a warranty reason, and BOTH warranty flows are guest forms that
 * work right now — they never required a sign-in and must not start to, since
 * the QR code on the retail carton points a stranger with a box straight at
 * registration. So the two warranty actions are the primary links, and they
 * are the whole point of this panel.
 */
export default function AccountsDisabled() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-black-soft p-8 text-center sm:p-10">
      <div
        aria-hidden="true"
        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-soft/25 bg-accent/10 text-accent-soft"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
        Accounts are coming soon.
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
        We haven&rsquo;t switched on customer accounts yet. Nothing you need is
        behind one — warranty registration and claims are open to everyone, no
        sign-in required.
      </p>

      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <a href={ROUTES.warrantyRegistration} className="btn-primary">
          Register a warranty
        </a>
        <a href={ROUTES.warrantyClaim} className="btn-secondary">
          Make a claim
        </a>
      </div>

      <p className="mt-6 text-xs text-white/45">
        Bought an IRIZ elsewhere?{' '}
        <a
          href={ROUTES.support}
          className="text-white/65 underline underline-offset-2 transition-colors hover:text-white"
        >
          Support can help
        </a>
        .
      </p>
    </div>
  );
}
