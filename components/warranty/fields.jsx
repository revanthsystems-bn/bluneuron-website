'use client';

/**
 * The parts the two warranty forms share: field chrome, the error summary,
 * the consent checkbox and the honeypot.
 *
 * The registration form and the claim form are NOT one component. They were
 * on the `launch-site` branch, and the two have since diverged past the point
 * where a `kind` prop pays for itself: registration asks where the unit was
 * bought and when, and walks a phone through two steps; a claim asks what is
 * wrong and for a description, and does not. Forking them keeps each
 * readable, and everything that genuinely must not drift between the two —
 * what a field looks like, how an error is announced, how consent is
 * recorded — lives here instead.
 *
 * VALIDATION RUNS ON SUBMIT, not on keystroke. A date field and a serial
 * number are both invalid for most of the time you are typing them, and
 * marking them red mid-entry is worse than one honest pass when they are
 * done. On failure every bad field gets an inline message tied to it with
 * `aria-describedby`, AND a summary appears at the top with a link to each
 * one and takes focus. Both, deliberately: the summary alone leaves a
 * sighted user hunting, and the inline messages alone are invisible to
 * someone who has just pressed a submit button at the bottom of eight
 * fields.
 */

/**
 * `[color-scheme:dark]` is not cosmetic polish — it is what makes the two
 * NATIVE controls on these forms usable. The browser draws the <select>
 * dropdown and the date picker itself, and without this it draws them light:
 * white popup, black text, on a black page. Scoped to the controls rather
 * than set on :root, so nothing else on the site (scrollbars included)
 * changes.
 */
export const FIELD_CLASS =
  'w-full rounded-ctl border border-border bg-white/[0.04] px-4 py-3 text-step-2 text-white placeholder-white/30 outline-none transition-colors [color-scheme:dark] focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft';

export const INVALID_CLASS = 'border-red-400/60';

/**
 * One labelled control: label, the control, then either its hint or its error.
 *
 * MODULE LEVEL, not nested inside a form component. Declared inside one it
 * would be a new component type on every render, so React would unmount and
 * remount the input on each keystroke and the field would lose focus after
 * every character typed.
 *
 * The error REPLACES the hint rather than stacking under it: two lines of
 * small print under a red border is noise, and the error is the only one of
 * the two still worth reading at that point.
 */
export function Field({ label, htmlFor, hint, error, errorId, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-step-1 font-medium text-ink-3">
        {label}{' '}
        <span className="text-accent-soft" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1.5 text-step-1 font-medium text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-step-1 text-ink-3">{hint}</p>
      )}
    </div>
  );
}

/**
 * The fixed +91 prefix, rendered beside the mobile input rather than typed
 * into it.
 *
 * India only (see REGION in lib/iriz.js), so the country code is a fact about
 * the form and not a decision for the visitor. Drawn as a sibling with the
 * input's own border suppressed on that edge, so the two read as one control
 * while the input stays a plain `<input>` that autofill and the browser's
 * own keyboard-type hinting still understand.
 */
export function PhonePrefix({ children, invalid }) {
  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-ctl border bg-white/[0.04] transition-colors focus-within:border-white/30 ${
        invalid ? INVALID_CLASS : 'border-border'
      }`}
    >
      <span
        className="flex select-none items-center border-r border-border px-3 text-step-2 text-ink-3"
        aria-hidden="true"
      >
        +91
      </span>
      {children}
    </div>
  );
}

/** The input class for a control sitting inside <PhonePrefix>. */
export const PREFIXED_FIELD_CLASS =
  'w-full bg-transparent px-4 py-3 text-step-2 text-white placeholder-white/30 outline-none [color-scheme:dark]';

/**
 * The error summary. Focusable by script (`tabIndex={-1}`) without adding a
 * tab stop, and `role="alert"` so it is announced the moment it appears —
 * which is the same moment focus arrives.
 */
export function ErrorSummary({ summaryRef, formError, fieldErrors, labels, idFor }) {
  return (
    <div
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
      className="mb-6 rounded-ctl border border-red-400/30 bg-red-400/10 p-4 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
    >
      <p className="text-step-2 font-semibold text-red-300">
        {formError || 'There is a problem with this form.'}
      </p>
      {fieldErrors.length > 0 && (
        <ul className="mt-2 space-y-1 text-step-2 text-red-200/80">
          {fieldErrors.map(([key, message]) => (
            <li key={key}>
              <a href={`#${idFor(key)}`} className="underline underline-offset-2">
                {labels[key]}: {message}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Consent, as a real checkbox that must be ticked.
 *
 * Not a pre-ticked box and not an "by submitting you agree" line under the
 * button: this form collects a name, an email, a mobile number and an order
 * ID, and consent to that has to be an action the visitor takes. Unticked is
 * a validation failure like any other, with the same inline message and the
 * same entry in the summary.
 */
export function ConsentField({ id, errorId, checked, onChange, error, disabled, children }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border bg-white/[0.04] accent-accent [color-scheme:dark] focus-visible:ring-2 focus-visible:ring-accent-soft ${
            error ? INVALID_CLASS : 'border-border'
          }`}
        />
        <span className="text-step-1 leading-relaxed text-ink-3">{children}</span>
      </label>
      {error && (
        <p id={errorId} className="mt-1.5 text-step-1 font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The honeypot: a real checkbox, hidden from sight, from the accessibility
 * tree and from the tab order. `hidden` alone is not enough — some bots skip
 * non-rendered fields — so it is positioned out of view instead. A human
 * never sees or toggles it; a bot that fills every field in the DOM ticks it,
 * and the server rejects the submission.
 */
export function Honeypot({ inputRef }) {
  return (
    <input
      ref={inputRef}
      type="checkbox"
      name="botcheck"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}

/** Today in Asia/Kolkata, as the `yyyy-mm-dd` an <input type="date"> max wants. */
export function todayInIndia() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
