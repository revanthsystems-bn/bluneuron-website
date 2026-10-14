'use client';

import { useAccount } from './AccountContext';
import { DEMO_USER } from '@/lib/account-demo';
import { ROUTES } from '@/lib/routes';

/**
 * Profile — what we hold about the person, and the two destructive controls.
 *
 * READ-ONLY IN PHASE 1. The fields are rendered as a definition list rather
 * than as a form, because there is nowhere to save them to yet and a form
 * whose Save button does nothing is worse than no form. Phase 2 turns this
 * into editable fields against the `profiles` table.
 *
 * SIGN OUT AND DELETE ARE NOT PEERS, and the layout says so. Sign out is an
 * ordinary secondary button. Delete is below a rule, in red, with its
 * consequence spelled out beside it — it is the one irreversible action in
 * the whole site. Under India's DPDP Act a person can withdraw consent and
 * have their data erased, so this has to exist and has to be findable; it
 * must not be one tap from the thing people press every day.
 *
 * The delete button is deliberately INERT in Phase 1 and says so. A delete
 * control that looks live and does nothing is the single most dangerous
 * placeholder a UI can carry.
 */
export default function ProfilePanel() {
  const { user, signOut, isDemo } = useAccount();
  const person = user ?? DEMO_USER;

  const fields = [
    { label: 'Name', value: person.name || 'Not set' },
    { label: 'Email', value: person.email },
    { label: 'Mobile', value: person.phone || 'Not set' },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Profile
          </h2>
          <button type="button" disabled className="btn-secondary cursor-not-allowed px-5 py-2 text-xs opacity-45">
            Edit
          </button>
        </div>

        <dl className="mt-6 divide-y divide-border-subtle">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-wrap gap-x-6 gap-y-1 py-4 first:pt-0 last:pb-0">
              <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                {field.label}
              </dt>
              <dd className="min-w-0 break-words text-sm text-white/80">{field.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-white/40">
          We hold your name, email and mobile number so a warranty claim can be matched to a unit
          and answered. What we store and how to have it removed is in our{' '}
          <a href={ROUTES.privacy} className="underline underline-offset-2 hover:text-white/70">
            privacy policy
          </a>
          .
        </p>
      </section>

      <section className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Account
        </h2>

        <div className="mt-6">
          <button type="button" onClick={signOut} className="btn-secondary">
            Sign out
          </button>
        </div>

        <div className="mt-8 border-t border-red-400/15 pt-6">
          <h3 className="text-sm font-semibold text-red-300">Delete my account and data</h3>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/45">
            Permanently removes your profile, saved addresses, registered products and claim
            history. Your warranty itself is not affected — it runs from the invoice date and
            belongs to the unit — but you would need your invoice and serial number again to make
            a claim.
          </p>
          <button
            type="button"
            disabled
            className="mt-5 cursor-not-allowed rounded-full border border-red-400/30 px-5 py-2.5 text-xs font-semibold text-red-300/50"
          >
            Delete account
            {isDemo && <span className="ml-2 font-normal text-white/35">(not active in demo)</span>}
          </button>
        </div>
      </section>
    </div>
  );
}
