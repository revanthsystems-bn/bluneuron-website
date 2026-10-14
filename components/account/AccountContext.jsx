'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_MODE, DEMO_USER } from '@/lib/account-demo';

const AccountContext = createContext(null);
const STORAGE_KEY = 'bluneuron-account-v1';

/**
 * Who is signed in — and, for now, nothing more than that.
 *
 * PHASE 1 IS DEMO MODE AND ONLY DEMO MODE. There is no backend yet: this
 * holds a session in `localStorage` so the account area can be designed,
 * reviewed and screenshotted against something that looks like real data.
 * Every surface that reads it also renders the "demo data" notice
 * (components/account/DemoNotice), so nothing here can be mistaken for a
 * real account by someone looking at a screenshot.
 *
 * WHY A CONTEXT RATHER THAN A HOOK PER PAGE: the masthead's avatar, the
 * account pages and the sign-in form all have to agree about the session the
 * instant it changes, and four components each reading `localStorage` on
 * mount is four components that disagree for one render after a sign-out.
 *
 * WHAT PHASE 2 REPLACES, and what it does not: `signIn`/`signOut` become
 * Supabase calls and `user` comes from the Supabase session. The SHAPE below
 * — `{ user, hydrated, signIn, signOut }` — is what every consumer is
 * written against and is meant to survive that change, so the swap is this
 * file and not the account area.
 *
 * `hydrated` is not optional. The server cannot know who is signed in, so
 * the first client render must match the server's (signed out) or React
 * reports a hydration mismatch; consumers show the signed-out state until
 * this flips. See the comment in AccountButton.
 */
export function AccountProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.email === 'string') setUser(parsed);
      }
    } catch {
      // Private mode, or storage disabled. Signed out is the safe answer.
    }
    setHydrated(true);
  }, []);

  const signIn = useCallback((partial = {}) => {
    // In demo mode every sign-in lands on the same demo identity, whatever
    // was typed — there is nothing to authenticate against. The email the
    // visitor entered is kept so the account area shows THEIR address rather
    // than a stranger's, which makes the demo read as their own account.
    const next = DEMO_MODE ? { ...DEMO_USER, ...partial } : { ...partial };
    setUser(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* session just will not survive a reload */
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing stored to clear */
    }
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, isDemo: DEMO_MODE, signIn, signOut }),
    [user, hydrated, signIn, signOut]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
}
