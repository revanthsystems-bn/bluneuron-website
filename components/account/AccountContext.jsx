'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEMO_MODE } from '@/lib/supabase/config';
import { DEMO_USER } from '@/lib/account-demo';

const AccountContext = createContext(null);
const DEMO_STORAGE_KEY = 'bluneuron-account-demo-v1';

/**
 * Who is signed in.
 *
 * TWO BACKENDS BEHIND ONE SHAPE. With Supabase configured this wraps a real
 * session: `sendCode` requests a one-time password, `verifyCode` exchanges
 * it for a session, and `signOut` ends it. With no keys configured
 * (DEMO_MODE) the same four functions drive a fixture session in
 * `localStorage`, so the account area can be designed and reviewed without a
 * backend. Every consumer is written against `{ user, hydrated, isDemo,
 * sendCode, verifyCode, signOut }` and does not know which it is talking to.
 *
 * WHY A CONTEXT. The masthead avatar, the account pages and the sign-in form
 * must agree about the session the instant it changes. Four components each
 * reading storage on mount is four components that disagree for one render
 * after a sign-out.
 *
 * `hydrated` is not optional. The server renders signed-out — it has no
 * access to the browser's storage, and for Supabase the session is resolved
 * asynchronously — so the first client render must match or React reports a
 * hydration mismatch. Consumers show the signed-out state until this flips.
 *
 * ERRORS ARE RETURNED, NOT THROWN. `sendCode`/`verifyCode` answer
 * `{ error }` so the form can render the message beside the field it belongs
 * to. A thrown error in an event handler ends up in an error boundary, which
 * is the wrong response to someone mistyping a six-digit code.
 */
export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  /* ---------------------------------------------------------------- *
   * Session bootstrap
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (DEMO_MODE) {
      try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.email === 'string') setUser(parsed);
        }
      } catch {
        // Private mode, or storage disabled. Signed out is the safe answer.
      }
      setHydrated(true);
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHydrated(true);
      return undefined;
    }

    let active = true;

    // `getUser()` rather than `getSession()`: it validates the token with
    // Supabase instead of trusting whatever is in the cookie. Same reasoning
    // as lib/supabase/server.js.
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(toProfile(data?.user));
      setHydrated(true);
    });

    // Keeps every tab in step: a sign-out in one window updates the others,
    // and a token refresh does not look like a sign-out here.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(toProfile(session?.user));
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* ---------------------------------------------------------------- *
   * Actions
   * ---------------------------------------------------------------- */

  /** Request a 6-digit code. */
  const sendCode = useCallback(async (email) => {
    if (DEMO_MODE) return { error: null };

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Anyone who has a code is allowed to become a user. This site has
        // nothing to sign up FOR beforehand — an account exists to hold a
        // warranty registration — so a separate registration step would be a
        // form standing between a customer and the thing they came to do.
        shouldCreateUser: true,
      },
    });
    return { error: error ? friendly(error) : null };
  }, []);

  /** Exchange the code for a session. */
  const verifyCode = useCallback(async (email, token) => {
    if (DEMO_MODE) {
      const next = { ...DEMO_USER, email: email || DEMO_USER.email };
      setUser(next);
      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* session just will not survive a reload */
      }
      return { error: null };
    }

    const supabase = getSupabaseBrowserClient();
    // `type: 'email'` is the one-time-password flow. `type: 'magiclink'`
    // is the clicked-link flow and rejects a typed code.
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return { error: friendly(error) };
    setUser(toProfile(data?.user));
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      setUser(null);
      try {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        /* nothing stored to clear */
      }
      return;
    }
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, isDemo: DEMO_MODE, sendCode, verifyCode, signOut }),
    [user, hydrated, sendCode, verifyCode, signOut]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}

/**
 * Supabase's user object, reduced to what this app shows.
 *
 * `user_metadata` is writable BY THE USER, so nothing in it is trusted for
 * anything but display. The name and phone shown in the account area come
 * from the `profiles` table, which has its own RLS policy; these are the
 * fallback for a brand-new account that has no profile row yet.
 */
function toProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.name ?? '',
    phone: user.user_metadata?.phone ?? '',
  };
}

/**
 * Supabase's error text is written for a developer. Two cases are worth
 * translating because a customer will actually hit them; everything else
 * passes through rather than being flattened into a useless "Sorry,
 * something went wrong".
 */
function friendly(error) {
  const message = error?.message ?? 'Something went wrong. Please try again.';
  if (/expired|invalid/i.test(message)) {
    return 'That code is wrong or has expired. Request a new one.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  return message;
}
