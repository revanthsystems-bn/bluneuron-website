'use client';

import { useId, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Magnetic from './Magnetic';
import { isValidEmail, normalizePhone, submitSupportRequest } from '@/lib/web3forms';
import { registerWarranty } from '@/lib/warranty-registration';
import { SUPPORT_PURCHASE_SOURCES } from '@/lib/site-config';
import { ROUTES } from '@/lib/routes';

/**
 * Warranty registration and warranty claim — ONE form, two modes.
 *
 * The two differ by exactly one field (a claim describes the problem), so they
 * are one component rather than two files that would drift on validation, on
 * the phone format, or on what counts as success. `kind` is 'registration' or
 * 'claim'; everything else follows from it, including the subject line the
 * inbox sees (see submitSupportRequest in lib/web3forms.js).
 *
 * VALIDATION runs on submit, not on keystroke — a date field and a serial
 * number are both invalid for most of the time you are typing them, and
 * marking them red while someone is mid-entry is a worse experience than a
 * single honest pass when they are done. On failure:
 *
 *   - every bad field gets an inline message tied to it with
 *     `aria-describedby`, below the input, where the fix is;
 *   - a summary appears at the top of the form with a link to each bad field,
 *     and FOCUS MOVES to it, so a keyboard or screen-reader user is told what
 *     is wrong instead of being left at the submit button;
 *   - nothing the visitor typed is cleared, including after a failed send.
 *
 * The inline messages and the summary are both present deliberately. The
 * summary alone leaves a sighted user hunting; the inline messages alone are
 * invisible to someone who has just pressed a submit button at the bottom of
 * eight fields.
 */

/**
 * `[color-scheme:dark]` is not cosmetic polish — it is what makes the two
 * NATIVE controls on this form usable. The browser draws the <select> dropdown
 * and the date picker itself, and without this it draws them light: white
 * popup, black text, on a black page. Scoped to the controls rather than set
 * on :root, so nothing else on the site (scrollbars included) changes.
 */
const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors [color-scheme:dark] focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft';
const INVALID_CLASS = 'border-red-400/60';

/**
 * One labelled control: label, the control, then either its hint or its error.
 *
 * MODULE LEVEL, not nested inside SupportForm. Declared inside the component
 * it would be a new component type on every render, so React would unmount and
 * remount the input on each keystroke and the field would lose focus after
 * every character typed.
 *
 * The error replaces the hint rather than stacking under it: two lines of
 * small print under a red border is noise, and the error is the only one of
 * the two that is still worth reading at that point.
 *
 * THE HINT IS `text-white/50`, AND THAT IS A FLOOR, NOT A TASTE. At `/35` it
 * measured 3.12:1 against this form's #0b0b0b — axe-core flagged every hint
 * on /support/warranty-registration and /support/warranty-claim, the two
 * pages this component renders. `/50` is 5.3:1, against the 4.5:1 WCAG AA
 * asks of 12px body text. The label stays `/50` and keeps its `font-medium`,
 * which is what separates the two now that the tones match. Do not dim
 * either of them again.
 */
function Field({ label, htmlFor, hint, error, errorId, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-white/50">
        {label}{' '}
        <span className="text-accent-soft" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-white/50">{hint}</p>
      )}
    </div>
  );
}

/**
 * Field order — the order the summary lists problems in, and the order the
 * fields appear on screen, so "the first message" and "the first field" are
 * always the same thing.
 */
const LABELS = {
  name: 'Full name',
  email: 'Email',
  phone: 'Mobile number',
  marketplace: 'Where you bought it',
  orderId: 'Order ID',
  purchaseDate: 'Purchase date',
  serialNumber: 'Serial number',
  issue: 'What is going wrong',
};

const MODES = {
  registration: {
    submitLabel: 'Register warranty',
    busyLabel: 'Registering…',
    successTitle: 'Your product is registered.',
    successBody:
      'We have your purchase details on file. Keep your invoice or purchase confirmation — it is the proof of purchase date a claim is assessed against.',
  },
  claim: {
    submitLabel: 'Submit claim',
    busyLabel: 'Submitting…',
    successTitle: 'Your claim is in.',
    successBody:
      'We have the details and will come back to you on the email address you gave. If your unit is still inside the marketplace return window, opening a return there is usually faster — see the note above.',
  },
};

/** Today, as the `yyyy-mm-dd` a <input type="date"> max attribute wants. */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SupportForm({ kind = 'registration' }) {
  /**
   * PRE-FILL FROM THE ACCOUNT, via the URL.
   *
   * "Raise a claim" on a registered unit (components/account/ProductList)
   * links here with the unit's details as query parameters, so a customer
   * does not retype the serial number and order ID the account page was just
   * showing them — which is the whole reason registering a unit is worth
   * doing. Query parameters rather than client state so the link survives
   * being opened in a new tab, copied, or followed after a sign-in.
   *
   * The values are still EDITABLE and still validated. Nothing here trusts
   * them: they arrive from a URL anyone can type, they are only ever used to
   * fill in a form the person then submits, and the claim is checked against
   * our records on the other end.
   */
  const searchParams = useSearchParams();
  const mode = MODES[kind] ?? MODES.registration;
  const isClaim = kind === 'claim';

  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  const [fields, setFields] = useState(() => ({
    name: '',
    email: '',
    phone: '',
    marketplace: searchParams.get('marketplace') ?? '',
    orderId: searchParams.get('order') ?? '',
    purchaseDate: searchParams.get('purchased') ?? '',
    serialNumber: searchParams.get('serial') ?? '',
    issue: '',
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [formError, setFormError] = useState('');
  // What a registration actually achieved: which of the two destinations
  // took it, and whether the person was signed in. Drives the success copy,
  // because "saved to your account" and "saved for our support team" are
  // genuinely different outcomes and the customer should be told which.
  const [outcome, setOutcome] = useState(null);

  const summaryRef = useRef(null);
  const botcheckRef = useRef(null);

  const busy = status === 'submitting';
  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(fields.email)) next.email = 'Enter a valid email address.';
    // Required here, unlike the launch-list signup: a warranty record with no
    // phone number is one we cannot act on when the email bounces.
    if (!normalizePhone(fields.phone)) {
      next.phone = 'Enter a 10-digit Indian mobile number.';
    }
    if (!fields.marketplace) next.marketplace = 'Choose where you bought it.';
    if (!fields.orderId.trim()) next.orderId = 'Enter the order ID from your invoice.';
    if (!fields.purchaseDate) {
      next.purchaseDate = 'Enter the purchase date.';
    } else if (fields.purchaseDate > todayIso()) {
      next.purchaseDate = 'The purchase date cannot be in the future.';
    }
    if (!fields.serialNumber.trim()) {
      next.serialNumber = 'Enter the serial number.';
    }
    if (isClaim && !fields.issue.trim()) {
      next.issue = 'Describe what is happening so we can help.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const next = validate();
    setErrors(next);
    setFormError('');

    if (Object.keys(next).length > 0) {
      setStatus('error');
      // The summary has to exist before it can take focus, and it renders on
      // the same tick this state change schedules — so the move waits a frame.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus('submitting');
    try {
      const submissionFields = {
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        marketplace: fields.marketplace,
        orderId: fields.orderId.trim(),
        purchaseDate: fields.purchaseDate,
        serialNumber: fields.serialNumber.trim(),
        botcheck: Boolean(botcheckRef.current?.checked),
      };
      if (isClaim) {
        // Claims are unchanged: Web3Forms email, plus the account's own claim
        // record where there is one. See lib/web3forms.js.
        await submitSupportRequest(kind, {
          ...submissionFields,
          issue: fields.issue.trim(),
        });
      } else {
        // Registration writes to the support Sheet AND, when signed in, to
        // the customer's account — one id across both, neither failure
        // killing the other. See lib/warranty-registration.js.
        const result = await registerWarranty(submissionFields);
        if (!result.ok) throw new Error(result.error);
        setOutcome(result);
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setFormError(err?.message || 'Something went wrong. Please try again.');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  if (status === 'success') {
    return (
      <div className="glass-panel p-6 sm:p-8" role="status">
        <p className="text-base font-semibold text-accent-soft">{mode.successTitle}</p>
        {/* The registration flow says what actually happened rather than one
            fixed sentence: whether it reached the account, the support team,
            or both. A claim has one destination and keeps its static copy. */}
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">
          {outcome?.message ?? mode.successBody}
        </p>

        {/* A GENTLE prompt, and only for someone who is not signed in. It
            offers a reason ("see it, with its warranty end date") rather than
            demanding an account — the registration has already succeeded, and
            nothing here is contingent on them creating one. */}
        {outcome && !outcome.signedIn && (
          <div className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-white">Want to see this in one place?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">
              Sign in with the same email address and this unit appears under My products &amp;
              warranty, with the date its cover ends. You do not need an account for the warranty
              itself — it runs from the invoice date either way.
            </p>
            <a href={ROUTES.signIn} className="btn-secondary mt-4 inline-flex">
              Sign in
            </a>
          </div>
        )}

        {/* Half-landed. The registration is safe, so this is informational
            rather than an error — but staying silent would leave someone
            wondering why the unit is missing from their account. */}
        {outcome && outcome.signedIn && !outcome.savedToAccount && (
          <p className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200/80">
            We could not add this unit to your account just now, though our support team has the
            registration. Try registering it again later and it will appear under My products
            &amp; warranty.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {outcome?.savedToAccount && (
            <a href={ROUTES.accountProducts} className="btn-primary inline-flex">
              See it in your account
            </a>
          )}
          <a href={ROUTES.support} className="btn-secondary inline-flex">
            Back to support
          </a>
        </div>
      </div>
    );
  }

  const fieldErrors = Object.keys(LABELS).filter((key) => errors[key]);
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

  /** The props <Field> needs for one named field. */
  const fieldProps = (name, hint) => ({
    label: LABELS[name],
    htmlFor: id(name),
    error: errors[name],
    errorId: errorId(name),
    hint,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel p-6 sm:p-8">
      {/* Web3Forms' honeypot: a real checkbox, hidden from sight, from the
          accessibility tree and from the tab order. `hidden` alone is not
          enough — some bots skip non-rendered fields — so it is positioned
          out of view instead. */}
      <input
        ref={botcheckRef}
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* `tabIndex={-1}` makes this focusable by script without adding a tab
          stop. `role="alert"` so it is announced when it appears, which is the
          same moment focus arrives. */}
      {showSummary && (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        >
          <p className="text-sm font-semibold text-red-300">
            {formError || 'There is a problem with this form.'}
          </p>
          {fieldErrors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-red-200/80">
              {fieldErrors.map((key) => (
                <li key={key}>
                  <a href={`#${id(key)}`} className="underline underline-offset-2">
                    {LABELS[key]}: {errors[key]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field {...fieldProps('name')}>
          <input type="text" autoComplete="name" {...inputProps('name')} />
        </Field>

        <Field {...fieldProps('email')}>
          <input type="email" autoComplete="email" {...inputProps('email')} />
        </Field>

        <Field {...fieldProps('phone', '10 digits, Indian mobile.')}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="98765 43210"
            {...inputProps('phone')}
          />
        </Field>

        <Field {...fieldProps('marketplace')}>
          {/* Keep purchase sources controlled so support requests use consistent values. */}
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

        <Field {...fieldProps('purchaseDate')}>
          <input type="date" max={todayIso()} {...inputProps('purchaseDate')} />
        </Field>

        <div className="sm:col-span-2">
          <Field {...fieldProps('serialNumber', 'On the label underneath the projector.')}>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              {...inputProps('serialNumber')}
            />
          </Field>
        </div>

        {isClaim && (
          <div className="sm:col-span-2">
            <Field
              {...fieldProps(
                'issue',
                'What happens, when it started, and anything you have already tried.'
              )}
            >
              <textarea rows={5} {...inputProps('issue', 'resize-none')} />
            </Field>
          </div>
        )}
      </div>

      <Magnetic
        as="button"
        type="submit"
        disabled={busy}
        className="btn-primary mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        strength={0.1}
      >
        {busy ? mode.busyLabel : mode.submitLabel}
      </Magnetic>

      {/* `/50`, not `/35`: this paragraph and the link inside it are 12px,
          and `/35` measured 3.12:1 against the form's #0b0b0b — under the
          4.5:1 WCAG AA asks of body text, and flagged by axe-core on both
          warranty pages. The link's hover stays `/60`. */}
      <p className="mt-5 text-xs leading-relaxed text-white/50">
        We use these details only to handle your warranty. They are not used for advertising and
        are never sent to any advertising platform.{' '}
        <a
          href={ROUTES.privacy}
          className="underline underline-offset-2 transition-colors hover:text-white/60"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
