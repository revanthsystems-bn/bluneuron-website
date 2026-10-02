'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import NewsletterPopup from '../NewsletterPopup';
import { NOTIFY_SOURCES } from '@/lib/web3forms';

/**
 * Pre-launch, every CTA on the site means the same thing: "put me on the
 * list". This is the one place that owns that, so the masthead button, the
 * mobile-menu button and the mobile sticky bar all open the SAME modal with
 * the same two fields, rather than each surface inventing its own path.
 *
 * Before this existed, NotifyButton scrolled to the inline form in
 * components/Newsletter — which worked, but meant the CTA behaved differently
 * depending on where you clicked it and sent people on a 10,000px journey to
 * the bottom of the page. The inline form stays; it is the same signup and
 * the same endpoint, just the version you meet by scrolling rather than by
 * asking.
 *
 * `source` rides along to Web3Forms so the inbox shows which surface a signup
 * came from.
 */

const NotifyContext = createContext(null);

const DISMISSED_KEY = 'bluneuron-iriz-popup-dismissed';
const AUTO_OPEN_DELAY_MS = 8000;

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside <NotifyProvider>');
  return ctx;
}

export default function NotifyProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState(NOTIFY_SOURCES.timedInvitation);

  const openNotify = useCallback((from = NOTIFY_SOURCES.timedInvitation) => {
    setSource(from);
    setOpen(true);
  }, []);

  const closeNotify = useCallback(() => setOpen(false), []);

  // A completed signup is remembered, so the unprompted invitation never
  // interrupts someone who is already on the list. It only ever suppresses the
  // AUTO open — a visitor who later clicks "Notify Me" asked for it, and must
  // always get it.
  //
  // This does NOT close the modal: it fires on success, and the success view
  // lives in that same panel until the visitor dismisses it. (It used to call
  // setOpen(false), which would have snapped the modal shut at the exact
  // moment it had something to say.)
  const markSubscribed = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // storage unavailable; the invitation simply returns next visit
    }
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISSED_KEY)) return undefined;
    } catch {
      // storage unavailable — treat as not dismissed and still invite
    }
    const t = setTimeout(() => openNotify(NOTIFY_SOURCES.timedInvitation), AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [openNotify]);

  // NO scroll lock or Esc handler here any more. Both used to live in this
  // provider AND in the modal, and the duplication was a real bug: effects
  // clean up child-first, so on close the modal restored `body.overflow` to
  // '' and then THIS provider restored it to the 'hidden' it had captured
  // from the modal a moment earlier. The page stayed locked after every
  // close. The modal owns it now, which is also where it has to live —
  // locking scroll means stopping Lenis too (lib/lenis.js), and only the
  // modal knows when its own exit animation is done.

  const value = useMemo(() => ({ open, openNotify, closeNotify }), [open, openNotify, closeNotify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <NewsletterPopup
        open={open}
        source={source}
        onClose={closeNotify}
        onSubscribed={markSubscribed}
      />
    </NotifyContext.Provider>
  );
}
