'use client';

import { useId, useRef, useState } from 'react';
import { SERIAL_LENGTH, isValidSerial, normalizeSerial } from '@/lib/club-serial';
import { CLUB, CLUB_HOME_PATH } from '@/lib/club';

/**
 * THE DOOR. Join with a serial, or sign in on another device.
 *
 * ONE COMPONENT FOR BOTH, with a `mode` switch, because they are the same
 * conversation at two moments — "I have a box" and "I have a box and I have
 * been here before" — and two components would mean two field layouts, two
 * error treatments and two places for the serial validation to drift.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE BROWSER VALIDATES, AND WHY IT IS NOT THE CONTROL
 * ---------------------------------------------------------------------------
 * The check letter runs here, as you type, so a mistyped serial is caught in
 * the field instead of after a round trip. That is a COURTESY. Every one of
 * these checks runs again in the route handler and a third time in SQL,
 * because this copy can be skipped by anyone who posts directly — see the
 * guard order at the top of app/api/club/join/route.js.
 *
 * THE SERIAL FIELD IS `inputMode="text"` AND NOT `type="number"` or a set of
 * boxes. Eleven characters in separate boxes looks tidy and is miserable:
 * paste does not work, backspace behaves oddly, and a screen reader announces
 * eleven unlabelled fields. One field, upper-cased as you type, spaces and
 * dashes forgiven.
 *
 * NO ANALYTICS CALLS ANYWHERE IN THIS FILE. Not a `join_attempt`, not a
 * `club_error`. The page sends a plain page_view like every other page and
 * nothing else — a serial number is a thing a person owns, and an event
 * carrying one, or carrying the fact that a particular visitor is joining,
 * is personal data in GA4. See the note in app/club/layout.jsx.
 */

const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft';
const INVALID_CLASS = 'border-red-400/60';

/**
 * The serial field's own class adds `font-mono` and `tracking-[0.18em]`.
 * Eleven characters of mixed letters and digits are read one at a time off a
 * sticker and checked one at a time against the screen, and a proportional
 * face makes that harder than it needs to be.
 */
const SERIAL_CLASS = `${FIELD_CLASS} font-mono uppercase tracking-[0.18em]`;

export default function ClubDoor() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const botcheckRef = useRef(null);

  const [mode, setMode] = useState('join');
  const [fields, setFields] = useState({
    serial: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const isJoin = mode === 'join';

  const update = (name) => (event) => {
    const value = name === 'consent' ? event.target.checked : event.target.value;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  /**
   * The serial is normalised AS IT IS TYPED, not on submit.
   *
   * Someone copying "irz-t6x-a001-d" off a sticker sees it become
   * "IRZT6XA001D" in the field, which is what the sticker says if you ignore
   * the grouping — so the field agrees with the box in front of them instead
   * of quietly accepting something that looks different.
   */
  const updateSerial = (event) => {
    setFields((prev) => ({ ...prev, serial: normalizeSerial(event.target.value) }));
    setErrors((prev) => ({ ...prev, serial: undefined }));
    setFormError('');
  };

  function validate() {
    const next = {};
    const serial = normalizeSerial(fields.serial);

    if (!serial) {
      next.serial = 'Enter the serial number from your box.';
    } else if (serial.length !== SERIAL_LENGTH) {
      next.serial = `A serial number is ${SERIAL_LENGTH} characters.`;
    } else if (!isValidSerial(serial)) {
      // Deliberately NOT "that serial does not exist" — this check knows
      // nothing about which serials are real. It knows the characters do not
      // add up, which is almost always a typo.
      next.serial = 'That does not look right. Check each character against the sticker.';
    }

    if (!fields.email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (isJoin) {
      if (!fields.name.trim()) next.name = 'Enter your first name.';
      if (!fields.consent) next.consent = 'Please tick the box to continue.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    if (botcheckRef.current?.checked) return;
    if (!validate()) return;

    setBusy(true);
    setFormError('');

    const endpoint = isJoin ? '/api/club/join' : '/api/club/signin';
    const payload = isJoin
      ? {
          serial: fields.serial,
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          city: fields.city.trim(),
          consent: true,
        }
      : { serial: fields.serial, email: fields.email.trim() };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // The cookie comes back on this response, so the request has to be
        // credentialed. Same-origin is the default, but stating it means a
        // future move to an absolute URL does not silently drop the cookie.
        credentials: 'same-origin',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setFormError(data.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }

      /*
       * A FULL NAVIGATION, not router.push().
       *
       * The cookie arrived on this response, and /club/home is a server
       * component that reads it. `router.push` would do a client-side
       * transition against a router cache populated before the cookie
       * existed, and the member would land back on the door. A real
       * navigation sends the new cookie with the request.
       */
      window.location.assign(CLUB_HOME_PATH);
    } catch {
      setFormError('Could not reach the Club. Check your connection and try again.');
      setBusy(false);
    }
  }

  const fieldProps = (name, extraClass = '') => ({
    id: id(name),
    value: fields[name],
    onChange: update(name),
    disabled: busy,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id(name)}-error` : undefined,
    className: `${FIELD_CLASS} ${extraClass} ${errors[name] ? INVALID_CLASS : ''}`,
  });

  const Error = ({ name }) =>
    errors[name] ? (
      <p id={`${id(name)}-error`} className="mt-1.5 text-xs font-medium text-red-400">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-panel space-y-4 p-6 sm:p-8">
      {/* The honeypot, as on every other form here: off-screen rather than
          hidden, out of the tab order and out of the accessibility tree, but
          a real checkbox in the DOM for a bot to tick. */}
      <input
        ref={botcheckRef}
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
      />

      <div>
        <h2 className="text-lg font-semibold text-white">
          {isJoin ? `Join the ${CLUB.name}` : 'Sign in on this device'}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          {isJoin
            ? 'One membership per IRIZ. The serial number on your box is the key.'
            : 'Your serial number and the email address you joined with.'}
        </p>
      </div>

      {/* `aria-live`, so a submit failure is announced rather than only seen.
          Someone using a screen reader presses the button and otherwise gets
          silence. */}
      <div aria-live="polite">
        {formError && (
          <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={id('serial')} className="mb-1.5 block text-xs font-medium text-white/50">
          Serial number
        </label>
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          maxLength={SERIAL_LENGTH + 4}
          {...fieldProps('serial')}
          onChange={updateSerial}
          className={`${SERIAL_CLASS} ${errors.serial ? INVALID_CLASS : ''}`}
        />
        <Error name="serial" />
      </div>

      {isJoin && (
        <div>
          <label htmlFor={id('name')} className="mb-1.5 block text-xs font-medium text-white/50">
            First name
          </label>
          <input type="text" autoComplete="given-name" maxLength={60} {...fieldProps('name')} />
          <Error name="name" />
        </div>
      )}

      <div>
        <label htmlFor={id('email')} className="mb-1.5 block text-xs font-medium text-white/50">
          Email
        </label>
        <input type="email" autoComplete="email" maxLength={160} {...fieldProps('email')} />
        <Error name="email" />
      </div>

      {isJoin && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={id('phone')}
                className="mb-1.5 block text-xs font-medium text-white/50"
              >
                Phone <span className="text-white/55">(optional)</span>
              </label>
              <input
                type="tel"
                autoComplete="tel"
                maxLength={20}
                placeholder="+91"
                {...fieldProps('phone')}
              />
              <Error name="phone" />
            </div>
            <div>
              <label
                htmlFor={id('city')}
                className="mb-1.5 block text-xs font-medium text-white/50"
              >
                City <span className="text-white/55">(optional)</span>
              </label>
              <input
                type="text"
                autoComplete="address-level2"
                maxLength={60}
                {...fieldProps('city')}
              />
              <Error name="city" />
            </div>
          </div>

          <div>
            {/* The label wraps the checkbox, so the whole line is the target —
                a 16px box on a phone is not. `items-start` keeps the box on
                the first line when the sentence wraps. */}
            <label className="flex items-start gap-3 text-sm leading-relaxed text-white/60">
              <input
                type="checkbox"
                checked={fields.consent}
                onChange={update('consent')}
                disabled={busy}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? `${id('consent')}-error` : undefined}
                className="mt-1 h-4 w-4 shrink-0 rounded border-border bg-white/[0.04] accent-accent-soft"
              />
              <span>
                I agree to BluNeuron contacting me about the {CLUB.name}.{' '}
                <a
                  href={CLUB.links.privacy}
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.consent && (
              <p id={`${id('consent')}-error`} className="mt-1.5 text-xs font-medium text-red-400">
                {errors.consent}
              </p>
            )}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Checking…' : isJoin ? 'Join the Club' : 'Sign in'}
      </button>

      <p className="text-center text-xs text-white/50">
        <button
          type="button"
          onClick={() => {
            setMode(isJoin ? 'signin' : 'join');
            setErrors({});
            setFormError('');
          }}
          /* `min-h-[44px]` with a negative margin: the box a finger lands on
             is 44px tall while the text stays where it looks right. The same
             pattern as the breadcrumb on /shop/iriz. */
          className="-my-3 inline-flex min-h-[44px] items-center px-2 underline underline-offset-4 decoration-white/25 transition-colors hover:text-white"
        >
          {isJoin ? 'Already a member? Sign in on this device' : 'Not a member yet? Join'}
        </button>
      </p>
    </form>
  );
}
