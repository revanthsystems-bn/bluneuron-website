'use client';

/**
 * The signup form itself — fields, validation, submit, states.
 *
 * Shared by the modal (components/NewsletterPopup) and the inline form at the
 * bottom of the page (components/Newsletter) so the two are identical by
 * construction. Only `source` and the surrounding chrome differ; everything a
 * visitor touches is this file.
 *
 * It owns its own submission so the two call sites cannot drift apart on
 * validation order, phone normalisation, or what counts as success. The parent
 * is told via `onSuccess` and decides what to show.
 */

import { useId, useRef, useState } from 'react';
import { isValidEmail, isValidPhone, submitNotifySignup } from '@/lib/web3forms';

export default function NotifyFields({
  source,
  onSuccess,
  submitLabel = 'Notify me',
  emailRef,
  disabled = false,
}) {
  const uid = useId();
  const emailId = `${uid}-email`;
  const phoneId = `${uid}-phone`;
  const emailErrorId = `${uid}-email-error`;
  const phoneErrorId = `${uid}-phone-error`;
  const formErrorId = `${uid}-form-error`;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' });
  const [formError, setFormError] = useState('');
  const botcheckRef = useRef(null);

  const busy = status === 'submitting' || disabled;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    // Validated in field order, so the first message a visitor sees is the
    // first field they'd look at.
    const next = { email: '', phone: '' };
    if (!isValidEmail(email)) next.email = 'Enter a valid email';
    // Optional: an empty field is valid and must never block a signup.
    if (phone.trim() && !isValidPhone(phone)) {
      next.phone = 'That mobile number doesn’t look right, or leave it blank';
    }

    setFieldErrors(next);
    setFormError('');
    if (next.email || next.phone) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const data = await submitNotifySignup(email, {
        phone: phone.trim(),
        source,
        // Web3Forms' honeypot. Read off the live DOM node rather than React
        // state on purpose: nothing in the UI can ever change it, so state
        // would only ever report `false` and the trap would never spring.
        botcheck: Boolean(botcheckRef.current?.checked),
      });
      // Success is ONLY this branch — a resolved promise from
      // submitNotifySignup, which itself only resolves on `success: true`.
      setStatus('idle');
      onSuccess?.(data);
    } catch (err) {
      // Keep everything typed. A failed send must not cost the visitor
      // their input.
      setStatus('error');
      setFormError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-7 text-left">
      {/* Web3Forms' honeypot: a real checkbox, hidden from sight, from the
          accessibility tree and from the tab order. A human never reaches it;
          a bot filling every input ticks it and the submission is rejected
          before the request is made. `hidden` alone is not enough — some bots
          skip non-rendered fields, so this is positioned out of view instead. */}
      <input
        ref={botcheckRef}
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div>
        <label htmlFor={emailId} className="notify-label">
          Email
        </label>
        <div className="notify-field" data-invalid={Boolean(fieldErrors.email)}>
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? emailErrorId : undefined}
            className="notify-input"
          />
        </div>
        {fieldErrors.email && (
          <p id={emailErrorId} className="notify-error">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor={phoneId} className="notify-label">
          Mobile
        </label>
        <div className="notify-field" data-invalid={Boolean(fieldErrors.phone)}>
          {/* Fixed, non-editable country code. The visitor types the national
              number only, which is why the validator accepts exactly ten
              digits and the payload is assembled as +91XXXXXXXXXX. */}
          <span className="notify-prefix" aria-hidden="true">
            +91
          </span>
          <span className="notify-divider" aria-hidden="true" />
          <input
            id={phoneId}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={busy}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? phoneErrorId : undefined}
            className="notify-input"
          />
          <span className="notify-optional" aria-hidden="true">
            Optional
          </span>
        </div>
        {fieldErrors.phone && (
          <p id={phoneErrorId} className="notify-error">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      {/* Submission failure — distinct from a field error, and shown above the
          button where the action is. Never a toast or an alert(). */}
      {formError && (
        <p id={formErrorId} role="alert" className="notify-error mt-4 text-center">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        aria-describedby={formError ? formErrorId : undefined}
        className="notify-submit mt-5"
      >
        {status === 'submitting' ? (
          <>
            <span className="notify-spinner" aria-hidden="true" />
            <span className="sr-only">Submitting…</span>
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
