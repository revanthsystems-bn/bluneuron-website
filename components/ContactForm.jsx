'use client';

import { useId, useRef, useState } from 'react';
import Magnetic from './Magnetic';
import { isValidEmail, submitContactMessage } from '@/lib/web3forms';
import { ROUTES } from '@/lib/routes';

/**
 * The general support message, on /support/contact.
 *
 * Brought in line with components/SupportForm rather than left as it was: it
 * now has the Web3Forms honeypot it was missing, per-field inline errors tied
 * to their inputs with `aria-describedby`, and a focusable error summary — so
 * a failed submit tells a keyboard or screen-reader user what is wrong instead
 * of leaving them on a button that did nothing visible.
 *
 * Still its own component rather than a third mode of SupportForm. The two
 * have almost nothing in common: this is three fields and a free-text message,
 * that is eight fields of structured warranty data with a date and a serial
 * number. Folding them together would mean a `kind` prop that changes every
 * field on the form, which is two forms in one file, not one form.
 *
 * Nothing here reaches the Meta Pixel. A support message carries a name, an
 * email and whatever the visitor chose to tell us, and none of that is
 * advertising data. See lib/metaPixel.js.
 */

const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft';
const INVALID_CLASS = 'border-red-400/60';

const LABELS = { name: 'Name', email: 'Email', message: 'Message' };
const initialFields = { name: '', email: '', message: '' };

export default function ContactForm() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const errorId = (name) => `${uid}-${name}-error`;

  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [formError, setFormError] = useState('');

  const summaryRef = useRef(null);
  const botcheckRef = useRef(null);

  const busy = status === 'submitting';
  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(fields.email)) next.email = 'Enter a valid email address.';
    if (!fields.message.trim()) next.message = 'Tell us what you need help with.';

    setErrors(next);
    setFormError('');

    if (Object.keys(next).length > 0) {
      setStatus('error');
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setStatus('submitting');
    try {
      await submitContactMessage({
        name: fields.name.trim(),
        email: fields.email.trim(),
        message: fields.message.trim(),
        // Read off the live DOM node, not React state: nothing in the UI can
        // change it, so state would only ever report `false`.
        botcheck: Boolean(botcheckRef.current?.checked),
      });
      setStatus('success');
      setFields(initialFields);
    } catch (err) {
      // Keep everything typed — a failed send must not cost the visitor the
      // message they just wrote.
      setStatus('error');
      setFormError(err?.message || 'Something went wrong. Please try again.');
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  if (status === 'success') {
    return (
      <div className="glass-panel p-8" role="status">
        <p className="text-base font-semibold text-accent-soft">Your message is in.</p>
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">
          We will get back to you on the email address you gave.
        </p>
      </div>
    );
  }

  const fieldErrors = Object.keys(LABELS).filter((key) => errors[key]);
  const showSummary = fieldErrors.length > 0 || Boolean(formError);

  const inputProps = (name, extraClass = '') => ({
    id: id(name),
    value: fields[name],
    onChange: update(name),
    disabled: busy,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? errorId(name) : undefined,
    className: `${FIELD_CLASS} ${extraClass} ${errors[name] ? INVALID_CLASS : ''}`,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel space-y-4 p-6 sm:p-8">
      {/* Web3Forms' honeypot — hidden from sight, from the accessibility tree
          and from the tab order, but a real checkbox in the DOM for a bot to
          tick. Positioned off-screen rather than `hidden`, because some bots
          skip fields that are not rendered. */}
      <input
        ref={botcheckRef}
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {showSummary && (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
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

      <div>
        <label htmlFor={id('name')} className="mb-1.5 block text-xs font-medium text-white/50">
          {LABELS.name}
        </label>
        <input type="text" autoComplete="name" {...inputProps('name')} />
        {errors.name && (
          <p id={errorId('name')} className="mt-1.5 text-xs font-medium text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={id('email')} className="mb-1.5 block text-xs font-medium text-white/50">
          {LABELS.email}
        </label>
        <input type="email" autoComplete="email" {...inputProps('email')} />
        {errors.email && (
          <p id={errorId('email')} className="mt-1.5 text-xs font-medium text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={id('message')} className="mb-1.5 block text-xs font-medium text-white/50">
          {LABELS.message}
        </label>
        <textarea rows={5} {...inputProps('message', 'resize-none')} />
        {errors.message && (
          <p id={errorId('message')} className="mt-1.5 text-xs font-medium text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      <Magnetic
        as="button"
        type="submit"
        disabled={busy}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        strength={0.1}
      >
        {busy ? 'Sending…' : 'Send message'}
      </Magnetic>

      <p className="text-xs leading-relaxed text-white/35">
        We use what you send only to answer you.{' '}
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
