'use client';

import { useId, useRef, useState } from 'react';
import Magnetic from '../Magnetic';
import {
  ConsentField,
  ErrorSummary,
  Field,
  FIELD_CLASS,
  Honeypot,
  INVALID_CLASS,
  PhonePrefix,
  PREFIXED_FIELD_CLASS,
  todayInIndia,
} from './fields';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import {
  PRODUCT_LABEL,
  SUPPORT,
  SUPPORT_PURCHASE_SOURCES,
  WARRANTY,
  coveredUntil,
  formatLongDate,
} from '@/lib/warranty';

/**
 * Warranty registration — one form, two shapes.
 *
 * On a wide screen it is a single card with "Your details" and "Purchase
 * details" side by side and ONE button, because the whole thing is eight
 * short fields and splitting eight fields across two screens on a desktop is
 * ceremony. On a phone the same two groups become two steps with a progress
 * bar, because eight fields in one column is a scroll with no sense of how
 * much is left, and the second half needs an invoice in the other hand.
 *
 * It is the SAME markup either way — the groups are always rendered, and
 * below `md` the inactive one is hidden. So there is no second code path to
 * keep in step, validation does not care which shape is on screen, and
 * nothing a visitor typed is lost by a resize mid-fill.
 *
 * NOTHING HERE IS SENT TO ANALYTICS. No GA4 event, no Meta Pixel event, not
 * on submit and not on success — a name, an email, a phone number, an order
 * ID and a serial number are exactly the fields that must never reach an ad
 * platform, and the safest way to guarantee that is for this file to contain
 * no analytics call at all. Do not add one.
 */

const LABELS = {
  name: 'Full name',
  email: 'Email',
  phone: 'Mobile number',
  marketplace: 'Where you bought it',
  orderId: 'Order ID',
  purchaseDate: 'Purchase date',
  serialNumber: 'Serial number',
  consent: 'Consent',
};

/** Which group each field belongs to — and so which mobile step it is on. */
const STEP_FIELDS = {
  1: ['name', 'email', 'phone'],
  2: ['marketplace', 'orderId', 'purchaseDate', 'serialNumber', 'consent'],
};

const STEP_TITLES = { 1: 'Your details', 2: 'Purchase details' };

/**
 * A v4 UUID for this registration, minted in the BROWSER.
 *
 * The id travels with the submission so the row written to the Sheet carries
 * an identifier the browser also knows, and a retry of the same registration
 * lands on the same row rather than creating a second one — the Apps Script
 * de-duplicates on it. It is not a secret and not a capability: it grants
 * nothing and reads nothing, and the server mints a fresh one if this is
 * missing or malformed.
 *
 * `crypto.randomUUID` needs a secure context; the fallback builds the same
 * shape out of `getRandomValues` so an http:// preview still produces a valid
 * id rather than throwing inside a submit handler.
 */
function newRegistrationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function RegistrationForm() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    marketplace: '',
    orderId: '',
    purchaseDate: '',
    serialNumber: '',
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState(1); // mobile only; ignored from `md` up
  const [registered, setRegistered] = useState(null);

  const summaryRef = useRef(null);
  const botcheckRef = useRef(null);

  const busy = status === 'submitting';
  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const maxDate = todayInIndia();

  const validate = (only) => {
    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(fields.email)) next.email = 'Enter a valid email address.';
    // Required, unlike the launch-list signup: a warranty record with no
    // phone number is one we cannot act on when the email bounces.
    if (!normalizePhone(fields.phone)) next.phone = 'Enter a 10-digit Indian mobile number.';
    if (!fields.marketplace) next.marketplace = 'Choose where you bought it.';
    if (!fields.orderId.trim()) next.orderId = 'Enter the order ID from your invoice.';
    if (!fields.purchaseDate) {
      next.purchaseDate = 'Enter the purchase date.';
    } else if (fields.purchaseDate > maxDate) {
      next.purchaseDate = 'The purchase date cannot be in the future.';
    }
    if (!fields.serialNumber.trim()) next.serialNumber = 'Enter the serial number.';
    if (!consent) next.consent = 'Please agree before submitting.';

    if (!only) return next;
    return Object.fromEntries(Object.entries(next).filter(([key]) => only.includes(key)));
  };

  /** The summary has to exist before it can take focus — so wait a frame. */
  const focusSummary = () => requestAnimationFrame(() => summaryRef.current?.focus());

  const handleContinue = () => {
    const next = validate(STEP_FIELDS[1]);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) {
      setStatus('error');
      focusSummary();
      return;
    }
    setStatus('idle');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const next = validate();
    setErrors(next);
    setFormError('');

    if (Object.keys(next).length > 0) {
      setStatus('error');
      // On a phone, a problem in the half that is off screen would otherwise
      // be announced and then be nowhere to be found. Step 1 wins when both
      // halves are bad, because it is the one you fix first.
      if (STEP_FIELDS[1].some((key) => next[key])) setStep(1);
      else if (STEP_FIELDS[2].some((key) => next[key])) setStep(2);
      focusSummary();
      return;
    }

    setStatus('submitting');

    const registrationId = newRegistrationId();
    const payload = {
      registrationId,
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      marketplace: fields.marketplace,
      orderId: fields.orderId.trim(),
      purchaseDate: fields.purchaseDate,
      serialNumber: fields.serialNumber.trim(),
      botcheck: Boolean(botcheckRef.current?.checked),
    };

    let data = null;
    try {
      const res = await fetch('/api/warranty-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => null);

      // SUCCESS IS THE SERVER'S WORD, never an assumption. A non-2xx, a body
      // that is not JSON, or a JSON body without `success: true` are all
      // failures — showing "you're registered" over any of them would send
      // someone away believing a record exists that does not.
      if (!res.ok || data?.success !== true) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'Could not save your registration. Please try again.'
        );
      }
    } catch (err) {
      // `fetch` rejects for a dropped connection, a blocked request and a
      // failed preflight alike, with whatever message the browser chose
      // ("Failed to fetch", "Load failed"). None of those are for a visitor
      // to read; the real one stays in the console.
      // eslint-disable-next-line no-console
      console.error('[BluNeuron] Warranty registration failed:', err);
      setStatus('error');
      setFormError(
        err?.message && !/fetch|network|load failed/i.test(err.message)
          ? err.message
          : 'Could not save your registration. Please try again.'
      );
      focusSummary();
      return;
    }

    setRegistered({
      registrationId: data.registrationId || registrationId,
      marketplace: fields.marketplace,
      purchaseDate: fields.purchaseDate,
    });
    setStatus('success');
  };

  if (status === 'success' && registered) {
    const until = formatLongDate(coveredUntil(registered.purchaseDate));
    return (
      <div className="glass-panel p-6 sm:p-8" role="status">
        <p className="text-base font-semibold text-accent-soft">You&rsquo;re registered.</p>
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">
          We have your purchase details on file, so a claim does not have to start with paperwork.
        </p>

        <dl className="mt-6 divide-y divide-border-subtle border-y border-border-subtle text-sm">
          <Row label="Registration ID">
            <span className="break-all font-mono text-xs text-white/80">
              {registered.registrationId}
            </span>
          </Row>
          <Row label="Product">{PRODUCT_LABEL}</Row>
          <Row label="Bought from">{registered.marketplace}</Row>
          {until && <Row label="Covered until">{until}</Row>}
        </dl>

        <p className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.03] p-4 text-xs leading-relaxed text-white/55">
          <strong className="font-semibold text-white/85">Keep your invoice.</strong> It is the
          proof of purchase date a claim is assessed against, and a registration on its own does
          not replace it.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="btn-primary inline-flex">
            Explore IRIZ
          </a>
          <a href="/support" className="btn-secondary inline-flex">
            Contact support
          </a>
        </div>
      </div>
    );
  }

  const fieldErrors = Object.keys(LABELS)
    .filter((key) => errors[key])
    .map((key) => [key, errors[key]]);
  const showSummary = fieldErrors.length > 0 || Boolean(formError);

  /** The props every control shares. Spread FIRST, so a caller can extend. */
  const inputProps = (name, extraClass = '') => ({
    id: id(name),
    value: fields[name],
    onChange: update(name),
    disabled: busy,
    'aria-required': true,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? errorId(name) : undefined,
    className: `${FIELD_CLASS} ${extraClass} ${errors[name] ? INVALID_CLASS : ''}`,
  });

  const fieldProps = (name, hint) => ({
    label: LABELS[name],
    htmlFor: id(name),
    error: errors[name],
    errorId: errorId(name),
    hint,
  });

  /** Hidden below `md` unless it is the active step; always shown above it. */
  const groupClass = (n) => (step === n ? 'block' : 'hidden md:block');

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel p-6 sm:p-8">
      <Honeypot inputRef={botcheckRef} />

      {/* The mobile stepper. `md:hidden` — on a desktop both groups are on
          screen at once, so a progress bar would be measuring nothing. */}
      <div className="mb-6 md:hidden">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-semibold text-white">{STEP_TITLES[step]}</p>
          <p className="text-xs text-white/55">Step {step} of 2</p>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={2}
          aria-label="Registration progress"
        >
          <div
            className="h-full rounded-full bg-accent-soft transition-[width] duration-300"
            style={{ width: `${step * 50}%` }}
          />
        </div>
      </div>

      {showSummary && (
        <ErrorSummary
          summaryRef={summaryRef}
          formError={formError}
          fieldErrors={fieldErrors}
          labels={LABELS}
          idFor={id}
        />
      )}

      {/* Two columns from `md` up, one below. Each group is a <fieldset> so
          its heading is announced as the group's name rather than read as a
          stray line of text above the first input. */}
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <fieldset className={`${groupClass(1)} min-w-0 space-y-5`} disabled={busy}>
          <legend className="mb-1 hidden text-sm font-semibold text-white md:block">
            Your details
          </legend>

          <Field {...fieldProps('name')}>
            <input type="text" autoComplete="name" {...inputProps('name')} />
          </Field>

          <Field {...fieldProps('email')}>
            <input type="email" autoComplete="email" {...inputProps('email')} />
          </Field>

          <Field {...fieldProps('phone', '10 digits, Indian mobile.')}>
            <PhonePrefix invalid={Boolean(errors.phone)}>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                {...inputProps('phone')}
                className={PREFIXED_FIELD_CLASS}
              />
            </PhonePrefix>
          </Field>
        </fieldset>

        <fieldset className={`${groupClass(2)} min-w-0 space-y-5`} disabled={busy}>
          <legend className="mb-1 hidden text-sm font-semibold text-white md:block">
            Purchase details
          </legend>

          <Field {...fieldProps('marketplace')}>
            <select {...inputProps('marketplace')}>
              <option value="" className="bg-black text-white">
                Select…
              </option>
              {SUPPORT_PURCHASE_SOURCES.map((source) => (
                <option key={source} value={source} className="bg-black text-white">
                  {source}
                </option>
              ))}
            </select>
          </Field>

          <Field {...fieldProps('orderId', 'From your invoice or purchase confirmation.')}>
            <input type="text" autoComplete="off" {...inputProps('orderId')} />
          </Field>

          <Field {...fieldProps('serialNumber', 'On the label underneath the projector.')}>
            <input type="text" autoComplete="off" spellCheck={false} {...inputProps('serialNumber')} />
          </Field>

          <Field {...fieldProps('purchaseDate', 'The invoice date, not the delivery date.')}>
            <input type="date" max={maxDate} {...inputProps('purchaseDate')} />
          </Field>

          <ConsentField
            id={id('consent')}
            errorId={errorId('consent')}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            error={errors.consent}
            disabled={busy}
          >
            I agree that BluNeuron may use these details to register and service my warranty, as
            described in the{' '}
            <a
              href="/legal/privacy"
              className="underline underline-offset-2 transition-colors hover:text-white/80"
            >
              Privacy Policy
            </a>
            .
          </ConsentField>
        </fieldset>
      </div>

      {/* MOBILE controls. "Continue" on step 1, "Back" beside submit on step
          2. Both `md:hidden`, because on a desktop there are no steps to move
          between and the single button below is the only one. */}
      <div className="mt-7 md:hidden">
        {step === 1 ? (
          <button type="button" onClick={handleContinue} className="btn-primary w-full">
            Continue
          </button>
        ) : (
          <div className="flex flex-col-reverse gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={busy}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Registering…' : 'Register warranty'}
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP submit — the one button the whole form has from `md` up. */}
      <div className="mt-7 hidden md:block">
        <Magnetic
          as="button"
          type="submit"
          disabled={busy}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          strength={0.1}
        >
          {busy ? 'Registering…' : 'Register warranty'}
        </Magnetic>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-white/50">
        We use these details only to register and service your warranty. They are not used for
        advertising and are never sent to any advertising platform. Trouble registering? Email{' '}
        <a
          href={`mailto:${SUPPORT.email}`}
          className="underline underline-offset-2 transition-colors hover:text-white/60"
        >
          {SUPPORT.email}
        </a>
        . Cover runs for {WARRANTY.months} months from the invoice date either way.
      </p>
    </form>
  );
}

/** One line of the success summary. */
function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs text-white/55">{label}</dt>
      <dd className="text-right text-sm font-medium text-white/85">{children}</dd>
    </div>
  );
}
