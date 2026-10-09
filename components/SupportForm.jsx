'use client';

import { useId, useRef, useState } from 'react';
import Magnetic from './Magnetic';
import { isValidEmail, normalizePhone, submitSupportRequest } from '@/lib/web3forms';
import { MARKETPLACES } from '@/lib/site-config';
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
 */
function Field({ label, htmlFor, hint, error, errorId, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-white/50">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-white/35">{hint}</p>
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
    successTitle: 'Your IRIZ is registered.',
    successBody:
      'We have your serial number and purchase details on file. Keep your marketplace invoice — it is the proof of purchase date a claim is assessed against.',
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
  const mode = MODES[kind] ?? MODES.registration;
  const isClaim = kind === 'claim';

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
    issue: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [formError, setFormError] = useState('');

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
    if (!fields.serialNumber.trim()) next.serialNumber = 'Enter the serial number.';
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
      await submitSupportRequest(kind, {
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        marketplace: fields.marketplace,
        orderId: fields.orderId.trim(),
        purchaseDate: fields.purchaseDate,
        serialNumber: fields.serialNumber.trim(),
        issue: isClaim ? fields.issue.trim() : '',
        // Web3Forms' honeypot, read off the live DOM node rather than React
        // state: nothing in the UI can change it, so state would only ever
        // report `false` and the trap would never spring.
        botcheck: Boolean(botcheckRef.current?.checked),
      });
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
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">{mode.successBody}</p>
        <a href={ROUTES.support} className="btn-secondary mt-6 inline-flex">
          Back to support
        </a>
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
          {/* A select, not free text: the answer is one of two listings plus
              "somewhere else", and typed answers ("amzn", "amazon.in", "amz")
              cannot be counted or filtered. Options come from MARKETPLACES in
              lib/site-config.js, so adding a third marketplace adds it here. */}
          <select {...inputProps('marketplace')}>
            <option value="">Select…</option>
            {MARKETPLACES.map((marketplace) => (
              <option key={marketplace.id} value={marketplace.name}>
                {marketplace.name}
              </option>
            ))}
            <option value="Other">Somewhere else</option>
          </select>
        </Field>

        <Field {...fieldProps('orderId', 'From your Amazon or Flipkart invoice.')}>
          <input type="text" autoComplete="off" {...inputProps('orderId')} />
        </Field>

        <Field {...fieldProps('purchaseDate')}>
          <input type="date" max={todayIso()} {...inputProps('purchaseDate')} />
        </Field>

        {/* Full width: the serial number is the longest value on the form and
            the one most often copied off a label, so it gets a field wide
            enough to read back without scrolling inside it. */}
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

      <p className="mt-5 text-xs leading-relaxed text-white/35">
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
