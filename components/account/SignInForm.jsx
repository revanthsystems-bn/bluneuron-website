'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from './AccountContext';
import { ROUTES } from '@/lib/routes';
import { isValidEmail } from '@/lib/web3forms';

/**
 * Sign in: Google, or a 6-digit code by email. Two methods, and the choice
 * between them is a WCAG 2.2 requirement rather than a nicety —
 * "Accessible Authentication" says a sign-in must not depend only on a
 * cognitive-function test, and transcribing a code from another app is
 * exactly that. Google OAuth is the alternative path, and the code input
 * accepts paste (nothing here blocks it, and `autoComplete="one-time-code"`
 * lets the browser or OS fill it).
 *
 * TWO STEPS, ONE COMPONENT. The email step and the code step share state
 * that would otherwise have to be lifted into a parent for no benefit; they
 * are one flow with one failure mode.
 *
 * PHASE 1 IS DEMO MODE. Nothing is sent and no code is checked: `signIn()`
 * sets a local demo session (components/account/AccountContext) so the
 * account area can be reviewed. Both buttons say so on screen — a sign-in
 * form that silently does nothing is the one screen you must never ship
 * ambiguous. Phase 2 replaces the two handlers with Supabase calls; the
 * markup and the states do not change.
 */
export default function SignInForm() {
  const router = useRouter();
  const { signIn, isDemo } = useAccount();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const codeRef = useRef(null);

  const sendCode = (event) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter an email address we can send the code to.');
      return;
    }
    setError('');
    setStep('code');
    // Focus the code field after the swap, so a keyboard user is not sent
    // back to the top of the form to find it.
    window.setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verifyCode = (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('That code should be six digits.');
      return;
    }
    setError('');
    signIn({ email: email.trim() });
    router.push(ROUTES.account);
  };

  const continueWithGoogle = () => {
    signIn({ email: email.trim() || undefined });
    router.push(ROUTES.account);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border-subtle bg-black-soft p-7 sm:p-9">
        {isDemo && (
          <p className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200/80">
            <span className="font-semibold text-amber-300">Demo mode.</span> No account system is
            connected yet, so nothing is sent and any six-digit code is accepted. This exists so
            the account screens can be reviewed.
          </p>
        )}

        <button type="button" onClick={continueWithGoogle} className="btn-primary w-full justify-center">
          <GoogleGlyph />
          Continue with Google
        </button>

        {/* A labelled rule, not a bare line: the divider is telling you these
            are alternatives, so it should say so. */}
        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
            or
          </span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode} noValidate>
            <label htmlFor="signin-email" className="mb-2 block text-sm font-medium text-white/80">
              Email address
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'signin-error' : undefined}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border-subtle bg-black px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
            />
            <button type="submit" className="btn-secondary mt-4 w-full justify-center">
              Email me a code
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} noValidate>
            <label htmlFor="signin-code" className="mb-2 block text-sm font-medium text-white/80">
              Six-digit code
            </label>
            <p className="mb-3 text-xs leading-relaxed text-white/45">
              Sent to <span className="text-white/70">{email}</span>.{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="underline underline-offset-2 transition-colors hover:text-white/80"
              >
                Use a different address
              </button>
            </p>
            <input
              id="signin-code"
              ref={codeRef}
              type="text"
              inputMode="numeric"
              // Lets the browser, iOS and Android offer the code from the
              // message itself. Blocking paste here — which some sites do
              // "for security" — is what turns this into the cognitive test
              // WCAG 2.2 forbids.
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'signin-error' : undefined}
              placeholder="000000"
              className="w-full rounded-xl border border-border-subtle bg-black px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-white outline-none transition-colors placeholder:tracking-[0.4em] placeholder:text-white/20 focus:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
            />
            <button type="submit" className="btn-primary mt-4 w-full justify-center">
              Sign in
            </button>
          </form>
        )}

        {/* The error sits under the field it belongs to AND is a live region,
            so it is both findable by eye and announced when it appears. */}
        {error && (
          <p id="signin-error" role="alert" className="mt-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <p className="mt-7 text-xs leading-relaxed text-white/40">
          Signing in creates a BluNeuron account for warranty registration and support. See our{' '}
          <a href={ROUTES.privacy} className="underline underline-offset-2 hover:text-white/70">
            privacy policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/** Google's mark, inline. Four paths, one per brand colour — not recoloured. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
