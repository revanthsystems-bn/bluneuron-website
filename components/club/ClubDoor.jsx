'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { SERIAL_EXAMPLE, SERIAL_LENGTH, isValidSerial, maskSerial, normalizeSerial } from '@/lib/club-serial';
import { normalizePhone } from '@/lib/web3forms';
import { CLUB, CLUB_HOME_PATH } from '@/lib/club';

/**
 * THE DOOR. Join in two steps, or sign in on another device.
 *
 * ===========================================================================
 * THE DEVICE FIRST, THEN THE PERSON.
 * ===========================================================================
 * Step one asks for the serial number and nothing else. Step two asks who
 * you are. The old form asked for all seven fields at once, which meant
 * somebody could type their name, mobile, email, city and tick a box before
 * being told the serial on their box is already registered — and then be
 * sent back to the top with the whole lot to do again.
 *
 * Splitting it costs one extra request and buys the only error that matters
 * being delivered after one field. It is also the shape every owner has
 * already met: the device, then the account.
 *
 * ---------------------------------------------------------------------------
 * WHAT STEP ONE IS, AND EMPHATICALLY IS NOT
 * ---------------------------------------------------------------------------
 * It is a COURTESY. /api/club/check-serial answers OK or CLAIMED, this
 * component moves to step two on OK, and NOTHING about that travels to the
 * join as an entitlement. The join posts the serial again, revalidates the
 * check letter, and `club_claim` checks the serial's existence and its
 * claimed-ness a third time in SQL. A person who skips step one entirely by
 * posting to /api/club/join gets exactly the same treatment as one who did
 * not — see the guard order at the top of app/api/club/join/route.js.
 *
 * Two people can be on step two for the same serial at once. Both were told
 * OK, both were told the truth at the time, and the unique index on
 * `club_members.serial` decides which of them finishes. The second one gets
 * the "already registered" message, which is the correct outcome and is why
 * step one reserves nothing.
 *
 * ---------------------------------------------------------------------------
 * THE SERIAL NEVER ENTERS THE URL
 * ---------------------------------------------------------------------------
 * It lives in `fields.serial`, in component state, for the life of the form.
 * Not a query parameter, not a path segment, not sessionStorage. A serial
 * number identifies a specific physical unit and therefore its owner, and a
 * URL carrying one leaks through the Referer header, through the browser's
 * history, through a shared link and into GA4's page_path — the one place
 * app/club/layout.jsx is categorical that it must never appear.
 *
 * The chip at the top of step two shows a MASKED serial for the same reason
 * at a smaller scale: it is enough to recognise your own box and not enough
 * to copy off a screen over your shoulder. See maskSerial.
 *
 * NO ANALYTICS CALLS ANYWHERE IN THIS FILE. Not a `join_attempt`, not a
 * `club_error`, not a `step_two_reached`. The page sends a plain page_view
 * like every other page and nothing else.
 *
 * ---------------------------------------------------------------------------
 * MOBILE FIRST
 * ---------------------------------------------------------------------------
 * Most arrivals here are a phone that has just scanned a QR code off a card
 * in a carton. Single column by default, two columns only from `sm`, every
 * control at least 44px tall, and the serial field in a mono face at
 * `text-base` so iOS does not zoom the viewport when it is focused —
 * anything under 16px triggers that, and the zoom does not undo itself.
 */

const FIELD_CLASS =
  'w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft';
const INVALID_CLASS = 'border-red-400/60';

/**
 * The serial field's own class: `font-mono`, wide tracking, and `text-base`.
 *
 * Eleven characters of mixed letters and digits are read one at a time off a
 * sticker and checked one at a time against the screen, and a proportional
 * face makes that harder than it needs to be. `text-base` (16px) rather than
 * the `text-sm` every other field uses is the iOS rule above: Safari zooms
 * the page in on any input under 16px, and this is the field people type
 * into most carefully.
 */
const SERIAL_CLASS = `${FIELD_CLASS} py-3.5 font-mono text-base uppercase tracking-[0.18em]`;

/**
 * Where the sticker is — a schematic, not a photograph.
 *
 * ===========================================================================
 * THIS DRAWS A LABEL, NOT A CARTON.
 * ===========================================================================
 * There is still no photograph of the retail box, and inventing one would
 * send people hunting in the wrong place — the objection that kept an
 * illustration off this page before. What is drawn instead is the thing we
 * DO know exactly: the shape of the label and the eleven characters printed
 * on it. Abstract rectangle, a barcode suggestion, the example serial in the
 * same mono face as the field below it. It tells a reader what they are
 * looking for without claiming to know what it is stuck to.
 *
 * `aria-hidden`, because the list beside it says the same thing in words and
 * a screen reader does not need a drawing described twice.
 */
function StickerSketch() {
  return (
    <svg
      viewBox="0 0 160 72"
      role="presentation"
      aria-hidden="true"
      className="h-[72px] w-[160px] shrink-0"
    >
      <rect
        x="1"
        y="1"
        width="158"
        height="70"
        rx="6"
        fill="rgba(255,255,255,0.04)"
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="4 3"
      />
      {/* The barcode block, suggested rather than drawn as a real symbology:
          a fake barcode that scanned to something would be worse than bars. */}
      {[12, 16, 19, 24, 27, 33, 36, 40, 45, 49, 52, 58, 61, 66].map((x, i) => (
        <rect
          key={x}
          x={x}
          y="12"
          width={i % 3 === 0 ? 2.5 : 1.2}
          height="26"
          fill="rgba(255,255,255,0.45)"
        />
      ))}
      <text
        x="12"
        y="56"
        fill="rgba(255,255,255,0.75)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        letterSpacing="1.4"
      >
        {SERIAL_EXAMPLE}
      </text>
      <text
        x="104"
        y="22"
        fill="rgba(255,255,255,0.35)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="7"
      >
        S/N
      </text>
    </svg>
  );
}

/** Where to look, in words. The same three places /club lists in its aside. */
const WHERE_TO_LOOK = [
  'The white label on the side of the retail carton.',
  'The sticker on the bottom of the projector.',
  'The warranty card inside the box.',
];

export default function ClubDoor() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const botcheckRef = useRef(null);
  const serialInputRef = useRef(null);
  const detailsHeadingRef = useRef(null);

  /**
   * `step` is only meaningful while `mode` is 'join'.
   *
   *   'serial'   step 1 of 2 — the serial, on its own
   *   'details'  step 2 of 2 — who you are
   *
   * Sign-in stays ONE step and always has: somebody signing in on a second
   * device already knows they are a member, and splitting two fields across
   * two screens would be ceremony for its own sake.
   */
  const [mode, setMode] = useState('join');
  const [step, setStep] = useState('serial');
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
  const onDetails = isJoin && step === 'details';

  /**
   * FOCUS MOVES WITH THE STEP, and it moves to the HEADING rather than to
   * the first field.
   *
   * Without this, pressing Continue leaves a keyboard or screen-reader user
   * on a button that no longer exists while the page silently becomes a
   * different form. Landing on the heading announces "Your details, step 2
   * of 2" and leaves the whole step ahead of them; landing on the first
   * input would skip that and start them mid-form.
   */
  useEffect(() => {
    if (onDetails) detailsHeadingRef.current?.focus();
  }, [onDetails]);

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

  /** The serial, client side. The same three messages on both steps. */
  function validateSerial() {
    const serial = normalizeSerial(fields.serial);
    if (!serial) return 'Enter the serial number from your box.';
    if (serial.length !== SERIAL_LENGTH) return `A serial number is ${SERIAL_LENGTH} characters.`;
    // Deliberately NOT "that serial does not exist" — this check knows
    // nothing about which serials are real. It knows the characters do not
    // add up, which is almost always a typo.
    if (!isValidSerial(serial)) {
      return 'That does not look right. Check each character against the sticker.';
    }
    return null;
  }

  function validateDetails() {
    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your first name.';

    if (!fields.email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    // REQUIRED now, where it used to be optional — see the note in
    // app/api/club/join/route.js. `normalizePhone` accepts "98765 43210",
    // "+91 98765 43210" and a pasted leading zero, so the "+91 optional"
    // part is a property of the parser rather than of the copy.
    if (!fields.phone.trim()) next.phone = 'Enter your mobile number.';
    else if (!normalizePhone(fields.phone)) {
      next.phone = 'Enter a 10-digit Indian mobile number.';
    }

    if (!fields.consent) next.consent = 'Please tick the box to continue.';
    return next;
  }

  /** Step one: ask whether this serial is real and free. */
  async function handleCheckSerial(event) {
    event.preventDefault();
    if (busy) return;
    if (botcheckRef.current?.checked) return;

    const serialError = validateSerial();
    if (serialError) {
      setErrors({ serial: serialError });
      return;
    }

    setBusy(true);
    setFormError('');

    try {
      const response = await fetch('/api/club/check-serial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: fields.serial }),
        credentials: 'same-origin',
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.status === 'OK') {
        setErrors({});
        setStep('details');
        setBusy(false);
        return;
      }

      if (response.ok && data.status === 'CLAIMED') {
        /*
         * STRAIGHT TO SIGN-IN, with the serial already filled in.
         *
         * Somebody whose serial is taken is nearly always the person who
         * took it, months ago, on another phone. Handing them the sign-in
         * form with the one field they have already typed still in it is
         * the whole value of asking for the serial first.
         */
        setMode('signin');
        setStep('serial');
        setErrors({});
        setFormError(
          'This serial is already registered. Sign in on this device with the email address you joined with.'
        );
        setBusy(false);
        return;
      }

      // Everything else, including a serial we have never heard of, arrives
      // as one message. See the note at the top of
      // app/api/club/check-serial/route.js for why that is not laziness.
      setFormError(data.error || 'Something went wrong. Please try again.');
      setBusy(false);
    } catch {
      setFormError('Could not reach the Club. Check your connection and try again.');
      setBusy(false);
    }
  }

  /** Step two, and the whole of sign-in. */
  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    if (botcheckRef.current?.checked) return;

    const serialError = validateSerial();
    if (serialError) {
      // Only reachable by editing the field on the sign-in form, or by a
      // state the two-step flow should make impossible. Handled anyway.
      setErrors({ serial: serialError });
      if (isJoin) setStep('serial');
      return;
    }

    if (isJoin) {
      const next = validateDetails();
      if (Object.keys(next).length > 0) {
        setErrors(next);
        return;
      }
    } else if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }

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

  function switchMode() {
    setMode(isJoin ? 'signin' : 'join');
    setStep('serial');
    setErrors({});
    setFormError('');
  }

  /** Back to step one, with the serial still in the field to be corrected. */
  function changeSerial() {
    setStep('serial');
    setErrors({});
    setFormError('');
    // The field is the reason they came back; put the cursor in it.
    requestAnimationFrame(() => serialInputRef.current?.focus());
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

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p id={`${id(name)}-error`} className="mt-1.5 text-xs font-medium text-red-400">
        {errors[name]}
      </p>
    ) : null;

  const heading = !isJoin
    ? 'Sign in on this device'
    : onDetails
      ? 'Your details'
      : 'Enter the serial number from your box sticker';

  const blurb = !isJoin
    ? 'Your serial number and the email address you joined with.'
    : onDetails
      ? 'Last step. We use these to reach you about the Club, and nothing else.'
      : 'One membership per IRIZ. The serial number on your box is the key.';

  return (
    <form
      onSubmit={isJoin && !onDetails ? handleCheckSerial : handleSubmit}
      noValidate
      className="glass-panel space-y-5 p-6 sm:p-8"
    >
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
        {/* THE PROGRESS INDICATOR, and it is text rather than two dots.
            "Step 1 of 2" is read correctly by a screen reader, survives a
            browser with no CSS, and tells somebody on a phone how much more
            there is — which is the actual question. Only on the join: a
            sign-in is one step and labelling it "Step 1 of 1" would be
            noise. */}
        {isJoin && (
          <p className="eyebrow mb-2.5 text-accent-soft">
            Step {onDetails ? '2' : '1'} of 2
          </p>
        )}
        <h2
          ref={detailsHeadingRef}
          tabIndex={-1}
          className="text-lg font-semibold leading-snug text-white outline-none"
        >
          {heading}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">{blurb}</p>
      </div>

      {/* `aria-live`, so a submit failure is announced rather than only seen.
          Someone using a screen reader presses the button and otherwise gets
          silence. */}
      <div aria-live="polite">
        {formError && (
          <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm leading-relaxed text-red-200">
            {formError}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------- STEP ONE */}
      {!onDetails && (
        <>
          <div>
            <label
              htmlFor={id('serial')}
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              Serial number
            </label>
            <input
              ref={serialInputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              placeholder={SERIAL_EXAMPLE}
              maxLength={SERIAL_LENGTH + 4}
              {...fieldProps('serial')}
              onChange={updateSerial}
              className={`${SERIAL_CLASS} ${errors.serial ? INVALID_CLASS : ''}`}
            />
            <FieldError name="serial" />
          </div>

          {/* WHERE TO LOOK, inside step one rather than only in the aside
              beside it. On a phone the aside is a screen and a half below
              the field, which is no help at all to the person holding a box
              and squinting at it. */}
          {isJoin && (
            <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <StickerSketch />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70">
                    Eleven characters, letters and digits, in one block.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/55">
                    {WHERE_TO_LOOK.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span
                          className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
                          aria-hidden="true"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* The sign-in form keeps its email field on the same screen. */}
          {!isJoin && (
            <div>
              <label
                htmlFor={id('email')}
                className="mb-1.5 block text-xs font-medium text-white/50"
              >
                Email
              </label>
              <input type="email" autoComplete="email" maxLength={160} {...fieldProps('email')} />
              <FieldError name="email" />
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------- STEP TWO */}
      {onDetails && (
        <>
          {/* THE CHIP. Which unit this is about, masked, with the way back.
              It answers "did I type the right one?" without putting eleven
              characters back on the screen — see maskSerial. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border-subtle bg-white/[0.03] px-4 py-3">
            {/* `/50` is the contrast floor on this panel, as it is on the
                warranty forms — see the note on Field in
                components/SupportForm.jsx. */}
            <span className="text-xs text-white/50">Serial</span>
            <span className="font-mono text-sm tracking-[0.14em] text-white">
              {maskSerial(fields.serial)}
            </span>
            <span className="text-sm text-accent-soft" aria-hidden="true">
              ✓
            </span>
            <span className="sr-only">checked</span>
            <button
              type="button"
              onClick={changeSerial}
              disabled={busy}
              /* `-my-3` with `min-h-[44px]`: the box a finger lands on is
                 44px tall while the text sits where it looks right. The same
                 pattern as the mode switch at the bottom. */
              className="-my-3 ml-auto inline-flex min-h-[44px] items-center px-1 text-xs underline underline-offset-4 decoration-white/25 transition-colors hover:text-white"
            >
              Change
            </button>
          </div>

          <div>
            <label htmlFor={id('name')} className="mb-1.5 block text-xs font-medium text-white/50">
              First name
            </label>
            <input type="text" autoComplete="given-name" maxLength={60} {...fieldProps('name')} />
            <FieldError name="name" />
          </div>

          <div>
            <label
              htmlFor={id('phone')}
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              Mobile number
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={20}
              placeholder="98765 43210"
              {...fieldProps('phone')}
            />
            {errors.phone ? (
              <FieldError name="phone" />
            ) : (
              <p className="mt-1.5 text-xs text-white/50">
                10 digits, Indian mobile. +91 is fine if you prefer to type it.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={id('email')}
              className="mb-1.5 block text-xs font-medium text-white/50"
            >
              Email
            </label>
            <input type="email" autoComplete="email" maxLength={160} {...fieldProps('email')} />
            <FieldError name="email" />
          </div>

          <div>
            <label htmlFor={id('city')} className="mb-1.5 block text-xs font-medium text-white/50">
              City <span className="font-normal text-white/50">(optional)</span>
            </label>
            <input type="text" autoComplete="address-level2" maxLength={60} {...fieldProps('city')} />
            <FieldError name="city" />
          </div>

          <div>
            {/* The label wraps the checkbox, so the whole line is the target —
                a 16px box on a phone is not. `items-start` keeps the box on
                the first line when the sentence wraps. */}
            <label className="flex items-start gap-3 py-1 text-sm leading-relaxed text-white/60">
              <input
                type="checkbox"
                checked={fields.consent}
                onChange={update('consent')}
                disabled={busy}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? `${id('consent')}-error` : undefined}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border bg-white/[0.04] accent-accent-soft"
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
        className="btn-primary min-h-[48px] w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? 'Checking…'
          : !isJoin
            ? 'Sign in'
            : onDetails
              ? `Join the ${CLUB.name}`
              : 'Continue'}
      </button>

      <p className="text-center text-xs text-white/50">
        <button
          type="button"
          onClick={switchMode}
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
