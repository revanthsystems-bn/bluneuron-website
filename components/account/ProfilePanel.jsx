'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from './AccountContext';
import { useAccountRecords } from './useAccountRecords';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEMO_MODE } from '@/lib/supabase/config';
import { DEMO_USER } from '@/lib/account-demo';
import { ROUTES } from '@/lib/routes';
import { SUPPORT } from '@/lib/site-config';

/**
 * Profile — what we hold about the person, and the two account actions.
 *
 * THE EMAIL IS NOT EDITABLE. It is the identity: the OTP goes to it, and
 * changing it is a re-authentication flow (prove the new address, prove the
 * old one) rather than a text field. Showing it as read-only is honest about
 * that; a field that silently refuses to save would not be.
 *
 * SIGN OUT AND DELETE ARE NOT PEERS, and the layout says so. Sign out is an
 * ordinary secondary button. Delete sits below a rule, in red, behind a typed
 * confirmation, with its consequence spelled out — it is the one
 * irreversible action in the site. Under the DPDP Act a person may withdraw
 * consent and have their data erased, so it has to exist and be findable; it
 * must not be one tap from the thing people press every day.
 *
 * WHAT DELETE CAN AND CANNOT DO FROM THE BROWSER. It removes every row this
 * person owns — profile, addresses, registered products, claims — which RLS
 * permits because they are theirs. It CANNOT remove the auth user itself:
 * that needs the service role key, which must never be in a browser bundle.
 * So the rows go immediately, the session is ended, and the residual auth
 * record (an email address and a user id, nothing else) is reported to the
 * person with the address to write to. That is the honest division, and it
 * is stated on screen rather than hidden behind a success message.
 */
export default function ProfilePanel() {
  const router = useRouter();
  const { user, signOut } = useAccount();
  const { profile, loading, reload } = useAccountRecords();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const person = user ?? (DEMO_MODE ? DEMO_USER : null);

  useEffect(() => {
    setName(profile?.full_name ?? person?.name ?? '');
    setPhone(profile?.phone ?? person?.phone ?? '');
  }, [profile, person?.name, person?.phone]);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');

    const supabase = getSupabaseBrowserClient();
    // `upsert`, not `update`: a brand-new account has no profile row until
    // it saves one, and an update against nothing succeeds while changing
    // nothing — which looks exactly like a save that worked.
    const { error: saveError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: name.trim(), phone: phone.trim() });

    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setEditing(false);
    setStatus('Profile saved.');
    reload();
  };

  const deleteEverything = async () => {
    setBusy(true);
    setError('');
    const supabase = getSupabaseBrowserClient();

    // Children first, then the profile. The foreign keys cascade, but doing
    // it explicitly means a partial failure leaves the rows that WERE
    // deleted deleted, rather than depending on one statement's success.
    for (const table of ['warranty_claims', 'registered_products', 'addresses', 'profiles']) {
      const { error: deleteError } = await supabase.from(table).delete().neq('id', '');
      if (deleteError && !/no rows/i.test(deleteError.message)) {
        setBusy(false);
        setError(`Could not delete your ${table.replace('_', ' ')}: ${deleteError.message}`);
        return;
      }
    }

    await signOut();
    setBusy(false);
    router.push(ROUTES.home);
  };

  if (loading && !person) return <p className="text-step-2 text-ink-3">Loading…</p>;

  const fields = [
    { label: 'Name', value: name || 'Not set' },
    { label: 'Email', value: person?.email ?? '—' },
    { label: 'Mobile', value: phone || 'Not set' },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border-subtle bg-black-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="text-step-2 font-semibold uppercase tracking-[0.18em] text-ink-2">
            Profile
          </h2>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={DEMO_MODE || !user}
            className="btn-secondary px-5 py-2 text-step-1 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-step-1 font-medium text-ink-3">
                Name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-ctl border border-border-subtle bg-black px-3 py-2.5 text-step-2 text-white outline-none focus:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-step-1 font-medium text-ink-3">
                Mobile
              </label>
              <input
                id="profile-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-ctl border border-border-subtle bg-black px-3 py-2.5 text-step-2 text-white outline-none focus:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-6 divide-y divide-border-subtle">
            {fields.map((field) => (
              <div key={field.label} className="flex flex-wrap gap-x-6 gap-y-1 py-4 first:pt-0 last:pb-0">
                <dt className="w-28 shrink-0 text-step-1 font-semibold uppercase tracking-[0.16em] text-ink-3">
                  {field.label}
                </dt>
                <dd className="min-w-0 break-words text-step-2 text-ink-2">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p aria-live="polite" className="mt-3 text-step-1 text-emerald-300">
          {status}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-step-1 text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-step-1 leading-relaxed text-ink-3">
          We hold your name, email and mobile number so a warranty claim can be matched to a unit
          and answered. Your email address is your sign-in and cannot be changed here — write to{' '}
          {SUPPORT.email} to move an account to a new address. What we store and how to have it
          removed is in our{' '}
          <a href={ROUTES.privacy} className="underline underline-offset-2 hover:text-ink-2">
            privacy policy
          </a>
          .
        </p>
      </section>

      <section className="rounded-card border border-border-subtle bg-black-soft p-6 sm:p-8">
        <h2 className="text-step-2 font-semibold uppercase tracking-[0.18em] text-ink-2">Account</h2>

        <div className="mt-6">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.refresh();
              router.push(ROUTES.home);
            }}
            className="btn-secondary"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 border-t border-red-400/15 pt-6">
          <h3 className="text-step-2 font-semibold text-red-300">Delete my account and data</h3>
          <p className="mt-2 max-w-prose text-step-1 leading-relaxed text-ink-3">
            Permanently removes your profile, saved addresses, registered products and claim
            history. Your warranty itself is not affected — it runs from the invoice date and
            belongs to the unit — but you would need your invoice and serial number again to make
            a claim.
          </p>
          <p className="mt-2 max-w-prose text-step-1 leading-relaxed text-ink-3">
            Your sign-in record (your email address and nothing else) is removed separately by us:
            email {SUPPORT.email} from that address and we will erase it.
          </p>

          <label htmlFor="delete-confirm" className="mt-5 block text-step-1 font-medium text-ink-3">
            Type DELETE to confirm
          </label>
          <input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={DEMO_MODE || !user}
            className="mt-1.5 w-full max-w-xs rounded-ctl border border-border-subtle bg-black px-3 py-2.5 text-step-2 text-white outline-none focus:border-red-400/40 disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          />

          <button
            type="button"
            onClick={deleteEverything}
            disabled={DEMO_MODE || !user || confirmText !== 'DELETE' || busy}
            className="mt-4 rounded-full border border-red-400/40 px-5 py-2.5 text-step-1 font-semibold text-red-300 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:border-red-400/20 disabled:text-red-300/40 disabled:hover:bg-transparent"
          >
            {busy ? 'Deleting…' : 'Delete my data'}
            {DEMO_MODE && <span className="ml-2 font-normal text-ink-3">(not active in demo)</span>}
          </button>
        </div>
      </section>
    </div>
  );
}
