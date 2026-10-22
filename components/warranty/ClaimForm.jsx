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
} from './fields';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import {
  CLAIM_DESCRIPTION_MIN,
  PRODUCT_LABEL,
  SUPPORT,
  WARRANTY_ISSUE_TYPES,
  newClaimReference,
} from '@/lib/warranty';

/**
 * Warranty claim.
 *
 * NO mobile stepper, unlike the registration form, and that is a decision
 * rather than an omission. Registration is an optional errand someone does
 * once with an invoice in the other hand, and splitting it in two makes a
 * phone screen manageable. A claim is filed by somebody whose projector has
 * stopped working: putting a "Continue" button between them and the box where
 * they describe the fault adds a step to the one form on this site that
 * should have none. One column, one pass, one button.
 *
 * NOTHING HERE IS SENT TO ANALYTICS — see the same note on RegistrationForm.
 * A claim carries a name, an email, a phone number, an order ID, a serial
 * number and a free-text description of a fault. None of it goes to GA4 or
 * the Meta Pixel, and the guarantee is that this file contains no analytics
 * call at all. Do not add one.
 */

/**
 * Plain strings, with a real `’` rather than an HTML entity: these are used
 * as JS values (a <label>'s text, a line in the error summary), not as markup,
 * so an entity here would render literally as "What&rsquo;s wrong".
 */
const LABELS = {
  name: 'Full name',
  email: 'Email',
  phone: 'Mobile number',
  orderId: 'Order ID',
  serialNumber: 'Serial number',
  issueType: 'What’s wrong',
  description: 'Describe the problem',
  consent: 'Consent',
};

export default function ClaimForm() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    serialNumber: '',
    issueType: '',
    description: '',
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [formError, setFormError] = useState('');
  const [filed, setFiled] = useState(null);

  const summaryRef = useRef(null);
  const botcheckRef = useRef(null);

  const busy = status === 'submitting';
  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const described = fields.description.trim().length;

  const validate = () => {
    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(fields.email)) next.email = 'Enter a valid email address.';
    if (!normalizePhone(fields.phone)) next.phone = 'Enter a 10-digit Indian mobile number.';
    if (!fields.orderId.trim()) next.orderId = 'Enter the order ID from your invoice.';
    if (!fields.serialNumber.trim()) next.serialNumber = 'Enter the serial number.';
    if (!fields.issueType) next.issueType = 'Choose what is going wrong.';
    if (described === 0) {
      next.description = 'Describe what is happening so we can help.';
    } else if (described < CLAIM_DESCRIPTION_MIN) {
      // A minimum, not a maximum: "it broke" is not a claim anyone can
      // assess, and the counter under the box says how far off it is rather
      // than only refusing at the end.
      next.description = `Please add a little more — at least ${CLAIM_DESCRIPTION_MIN} characters.`;
    }
    if (!consent) next.consent = 'Please agree before submitting.';
    return next;
  };

  const focusSummary = () => requestAnimationFrame(() => summaryRef.current?.focus());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const next = validate();
    setErrors(next);
    setFormError('');

    if (Object.keys(next).length > 0) {
      setStatus('error');
      focusSummary();
      return;
    }

    setStatus('submitting');

    const claimRef = newClaimReference();
    const payload = {
      claimRef,
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      orderId: fields.orderId.trim(),
      serialNumber: fields.serialNumber.trim(),
      issueType: fields.issueType,
      description: fields.description.trim(),
      botcheck: Boolean(botcheckRef.current?.checked),
    };

    let data = null;
    try {
      const res = await fetch('/api/warranty-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await res.json().catch(() => null);

      // SUCCESS IS THE SERVER'S WORD. The route tries the Sheet and then
      // email, and reports success only if one of the two actually took the
      // claim — so a visitor is never told their claim is in when it is
      // nowhere. See app/api/warranty-claim/route.js.
      if (!res.ok || data?.success !== true) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'Could not submit your claim. Please try again.'
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[BluNeuron] Warranty claim failed:', err);
      setStatus('error');
      setFormError(
        err?.message && !/fetch|network|load failed/i.test(err.message)
          ? err.message
          : 'Could not submit your claim. Please try again.'
      );
      focusSummary();
      return;
    }

    setFiled({
      claimRef: data.claimRef || claimRef,
      issueType: fields.issueType,
    });
    setStatus('success');
  };

  if (status === 'success' && filed) {
    return (
      <div className="glass-panel p-6 sm:p-8" role="status">
        <p className="text-base font-semibold text-accent-soft">Your claim is in.</p>
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">
          We have the details and will come back to you on the email address you gave. Quote the
          reference below in any follow-up.
        </p>

        <dl className="mt-6 divide-y divide-border-subtle border-y border-border-subtle text-sm">
          <Row label="Claim reference">
            <span className="font-mono text-sm text-white">{filed.claimRef}</span>
          </Row>
          <Row label="Product">{PRODUCT_LABEL}</Row>
          <Row label="Reported">{filed.issueType}</Row>
        </dl>

        <p className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.03] p-4 text-xs leading-relaxed text-white/55">
          <strong className="font-semibold text-white/85">Keep your invoice to hand.</strong> It is
          the proof of purchase date the claim is assessed against.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/support" className="btn-primary inline-flex">
            Contact support
          </a>
          <a href="/legal/warranty" className="btn-secondary inline-flex">
            Warranty policy
          </a>
        </div>
      </div>
    );
  }

  const fieldErrors = Object.keys(LABELS)
    .filter((key) => errors[key])
    .map((key) => [key, errors[key]]);
  const showSummary = fieldErrors.length > 0 || Boolean(formError);

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

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel p-6 sm:p-8">
      <Honeypot inputRef={botcheckRef} />

      {showSummary && (
        <ErrorSummary
          summaryRef={summaryRef}
          formError={formError}
          fieldErrors={fieldErrors}
          labels={LABELS}
          idFor={id}
        />
      )}

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <fieldset className="min-w-0 space-y-5" disabled={busy}>
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

        <fieldset className="min-w-0 space-y-5" disabled={busy}>
          <legend className="mb-1 hidden text-sm font-semibold text-white md:block">
            The unit
          </legend>

          <Field {...fieldProps('orderId', 'From your invoice or purchase confirmation.')}>
            <input type="text" autoComplete="off" {...inputProps('orderId')} />
          </Field>

          <Field {...fieldProps('serialNumber', 'On the label underneath the projector.')}>
            <input type="text" autoComplete="off" spellCheck={false} {...inputProps('serialNumber')} />
          </Field>

          <Field {...fieldProps('issueType')}>
            <select {...inputProps('issueType')}>
              <option value="" className="bg-black text-white">
                Select…
              </option>
              {WARRANTY_ISSUE_TYPES.map((issue) => (
                <option key={issue} value={issue} className="bg-black text-white">
                  {issue}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      </div>

      {/* Full width, below both columns. A fault description is the field
          people write most in, and a textarea in a half-width column on a
          desktop is a worse box to write in than the fields above it. */}
      <div className="mt-5">
        <fieldset disabled={busy}>
          <Field
            {...fieldProps(
              'description',
              'What happens, when it started, and anything you have already tried.'
            )}
          >
            <textarea rows={5} {...inputProps('description', 'resize-y')} />
          </Field>
          {!errors.description && (
            <p
              className={`mt-1.5 text-xs ${
                described >= CLAIM_DESCRIPTION_MIN ? 'text-white/50' : 'text-white/55'
              }`}
              aria-live="polite"
            >
              {described >= CLAIM_DESCRIPTION_MIN
                ? `${described} characters.`
                : `${CLAIM_DESCRIPTION_MIN - described} more character${
                    CLAIM_DESCRIPTION_MIN - described === 1 ? '' : 's'
                  } needed.`}
            </p>
          )}
        </fieldset>
      </div>

      <div className="mt-5">
        <ConsentField
          id={id('consent')}
          errorId={errorId('consent')}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          error={errors.consent}
          disabled={busy}
        >
          I agree that BluNeuron may use these details to assess and handle my warranty claim, as
          described in the{' '}
          <a
            href="/legal/privacy"
            className="underline underline-offset-2 transition-colors hover:text-white/80"
          >
            Privacy Policy
          </a>
          .
        </ConsentField>
      </div>

      <Magnetic
        as="button"
        type="submit"
        disabled={busy}
        className="btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        strength={0.1}
      >
        {busy ? 'Submitting…' : 'Submit claim'}
      </Magnetic>

      <p className="mt-5 text-xs leading-relaxed text-white/50">
        We use these details only to handle your claim. They are not used for advertising and are
        never sent to any advertising platform. Trouble submitting? Email{' '}
        <a
          href={`mailto:${SUPPORT.email}`}
          className="underline underline-offset-2 transition-colors hover:text-white/60"
        >
          {SUPPORT.email}
        </a>
        .
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
