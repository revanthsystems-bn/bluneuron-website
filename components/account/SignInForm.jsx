'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from './AccountContext';
import { ROUTES } from '@/lib/routes';
import { isValidEmail } from '@/lib/web3forms';

/**
 * Sign in: a 6-digit code by email. ONE method, deliberately.
 *
 * Google sign-in was removed on request. That leaves a one-time code as the
 * only route, which WCAG 2.2's "Accessible Authentication" allows ONLY
 * because of its own exception: a sign-in may use a cognitive-function test
 * when there is a mechanism to assist. That mechanism is why two details
 * below are requirements rather than polish — nothing blocks paste, and
 * `autoComplete="one-time-code"` lets the browser, iOS and Android offer the
 * code straight from the message. Remove either and this screen stops being
 * accessible to anyone who cannot hold six digits in their head between two
 * apps.
 *
 * TWO STEPS, ONE COMPONENT. The email step and the code step share state
 * that would otherwise have to be lifted into a parent for no benefit; they
 * are one flow with one failure mode.
 *
 * TWO BACKENDS, ONE FORM. With Supabase configured, "Email me a code" calls
 * `signInWithOtp` and "Sign in" calls `verifyOtp`. Without it (DEMO_MODE),
 * no email is sent and any six digits are accepted — and the amber notice
 * at the top says so, because a sign-in form that silently does nothing is
 * the one screen you must never ship ambiguous. The markup is identical
 * either way; only components/account/AccountContext knows the difference.
 */
export default function SignInForm() {
  const router = useRouter();
  const { sendCode, verifyCode, isDemo } = useAccount();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const codeRef = useRef(null);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter an email address we can send the code to.');
      return;
    }
    setError('');
    setBusy(true);
    const { error: sendError } = await sendCode(email.trim());
    setBusy(false);
    if (sendError) {
      setError(sendError);
      return;
    }
    setStep('code');
    // Focus the code field after the swap, so a keyboard user is not sent
    // back to the top of the form to find it.
    window.setTimeout(() => codeRef.current?.focus(), 50);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('That code should be six digits.');
      return;
    }
    setError('');
    setBusy(true);
    const { error: verifyError } = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (verifyError) {
      setError(verifyError);
      return;
    }
    // `refresh()` before `push()`: the account layout reads the session on
    // the SERVER, and without this the router would serve the cached
    // signed-out render of /account and bounce straight back here.
    router.refresh();
    router.push(ROUTES.account);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border-subtle bg-black-soft p-7 sm:p-9">
        {isDemo && (
          <p className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-200/80">
            <span className="font-semibold text-amber-300">Demo mode.</span> No Supabase project
            is configured for this build, so no email is sent and any six-digit code is accepted.
            This exists so the account screens can be reviewed.
          </p>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSend} noValidate>
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
            <button
              type="submit"
              disabled={busy}
              className="btn-secondary mt-4 w-full justify-center disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Email me a code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate>
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
            <button
              type="submit"
              disabled={busy}
              className="btn-primary mt-4 w-full justify-center disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Checking…' : 'Sign in'}
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
