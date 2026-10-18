'use client';

import { useState } from 'react';
import { useAccountRecords } from './useAccountRecords';
import { useAccount } from './AccountContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEMO_MODE } from '@/lib/supabase/config';

/**
 * Saved addresses — list, add, set default, remove.
 *
 * WHY A BRAND SITE HOLDS ADDRESSES AT ALL, given it takes no orders: a
 * warranty claim ends with a unit being collected or sent back, and that
 * needs somewhere to send it. The copy says so, because an address book on a
 * site that cannot deliver anything otherwise looks like data collected for
 * its own sake — which, under the DPDP Act, is what purpose limitation
 * forbids.
 *
 * ONE DEFAULT, enforced in the DATABASE rather than here. A unique partial
 * index (`where is_default`) means Postgres rejects a second default even if
 * two tabs race, which a client-side "unset the others first" cannot
 * promise. Setting a new default is therefore two statements in order, and
 * the failure mode of the first succeeding and the second failing is a user
 * with no default — recoverable and visible — rather than two.
 *
 * In DEMO MODE the form is disabled and the fixtures are read-only: there is
 * nowhere to write to, and a form that accepts input and discards it is
 * worse than one that says it cannot.
 */
export default function AddressList() {
  const { user } = useAccount();
  const { addresses, loading, reload } = useAccountRecords();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const readOnly = DEMO_MODE || !user;

  const addAddress = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');

    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from('addresses').insert({
      // `user_id` is NOT set here. The column defaults to `auth.uid()` in
      // Postgres and the RLS insert policy requires it to equal `auth.uid()`
      // — so the database decides whose row this is, and a client cannot
      // write a row into someone else's account even by asking.
      label: form.get('label') || 'Home',
      full_name: form.get('full_name'),
      line1: form.get('line1'),
      line2: form.get('line2') || null,
      city: form.get('city'),
      state: form.get('state'),
      pincode: form.get('pincode'),
      phone: form.get('phone') || null,
      is_default: addresses.length === 0,
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setAdding(false);
    reload();
  };

  const removeAddress = async (id) => {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from('addresses').delete().eq('id', id);
    setBusy(false);
    if (deleteError) setError(deleteError.message);
    else reload();
  };

  const makeDefault = async (id) => {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    // Clear first, then set. The unique index rejects two defaults, so the
    // order matters and cannot be collapsed into one statement.
    await supabase.from('addresses').update({ is_default: false }).neq('id', id);
    const { error: updateError } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id);
    setBusy(false);
    if (updateError) setError(updateError.message);
    else reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-step-2 font-semibold uppercase tracking-[0.18em] text-ink-2">
            Saved addresses
          </h2>
          <p className="mt-2 max-w-prose text-step-1 leading-relaxed text-ink-3">
            Used to arrange a service pickup or return when you raise a warranty claim. Your
            marketplace delivery address stays with Amazon or Flipkart — we are not given it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          disabled={readOnly}
          className="btn-secondary px-5 py-2 text-step-1 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {adding ? 'Cancel' : 'Add address'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-step-1 text-red-300">
          {error}
        </p>
      )}

      {adding && !readOnly && (
        <form
          onSubmit={addAddress}
          className="grid gap-4 rounded-card border border-border-subtle bg-black-soft p-6 sm:grid-cols-2"
        >
          <Field name="label" label="Label" placeholder="Home" />
          <Field name="full_name" label="Full name" required />
          <Field name="line1" label="Address line 1" required className="sm:col-span-2" />
          <Field name="line2" label="Address line 2" className="sm:col-span-2" />
          <Field name="city" label="City" required />
          <Field name="state" label="State" required />
          <Field name="pincode" label="PIN code" required inputMode="numeric" />
          <Field name="phone" label="Phone" inputMode="tel" />
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-step-2 text-ink-3">Loading…</p>
      ) : addresses.length === 0 ? (
        <div className="rounded-card border border-border-subtle bg-black-soft px-6 section-y text-center">
          <h3 className="text-step-3 font-semibold text-white">No addresses saved</h3>
          <p className="mx-auto mt-2 max-w-sm text-step-2 leading-relaxed text-ink-3">
            Add one and a warranty claim can be arranged without asking you for it again.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-card border border-border-subtle bg-black-soft p-6">
              <div className="flex items-center gap-3">
                <h3 className="text-step-2 font-semibold text-white">{address.label}</h3>
                {address.isDefault && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-step-0 font-semibold uppercase tracking-wide text-accent-soft">
                    Default
                  </span>
                )}
              </div>

              <address className="mt-4 text-step-2 not-italic leading-relaxed text-ink-3">
                {address.name}
                <br />
                {address.line1}
                <br />
                {address.line2 && (
                  <>
                    {address.line2}
                    <br />
                  </>
                )}
                {address.city}, {address.state} {address.pincode}
                {address.phone && (
                  <>
                    <br />
                    {address.phone}
                  </>
                )}
              </address>

              <div className="mt-5 flex gap-4 text-step-1">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address.id)}
                    disabled={readOnly || busy}
                    className="text-ink-3 underline underline-offset-2 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/25 disabled:no-underline"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAddress(address.id)}
                  disabled={readOnly || busy}
                  className="text-ink-3 underline underline-offset-2 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:text-white/25 disabled:no-underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A labelled input. Visible label, not a placeholder standing in for one. */
function Field({ name, label, className = '', ...rest }) {
  return (
    <div className={className}>
      <label htmlFor={`addr-${name}`} className="mb-1.5 block text-step-1 font-medium text-ink-3">
        {label}
        {rest.required && <span className="text-ink-3"> *</span>}
      </label>
      <input
        id={`addr-${name}`}
        name={name}
        type="text"
        {...rest}
        className="w-full rounded-ctl border border-border-subtle bg-black px-3 py-2.5 text-step-2 text-white outline-none transition-colors placeholder:text-ink-3 focus:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
      />
    </div>
  );
}
