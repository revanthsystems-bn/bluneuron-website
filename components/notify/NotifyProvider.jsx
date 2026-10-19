'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { NOTIFY_SOURCES } from '@/lib/web3forms';
import { NOTIFY_AUTO_OPEN } from '@/lib/site-config';

/**
 * Deferred for the same reason as the buy sheet: this provider is mounted in
 * the root layout, and a static import put the modal's markup, framer-motion
 * and its form code into every page's JavaScript for a dialog that — with
 * NOTIFY_AUTO_OPEN off — now opens only when someone asks for it.
 */
const NewsletterPopup = dynamic(() => import('../NewsletterPopup'), { ssr: false });

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

/** How often to re-check when the invitation lands while a modal is open. */
const RETRY_WHILE_BUSY_MS = 2000;

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside <NotifyProvider>');
  return ctx;
}

export default function NotifyProvider({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Latched, so the chunk is requested once and only on a page where the
  // modal is actually used. See BuyProvider for the same pattern.
  const [everOpened, setEverOpened] = useState(false);
  const [source, setSource] = useState(NOTIFY_SOURCES.timedInvitation);

  const openNotify = useCallback((from = NOTIFY_SOURCES.timedInvitation) => {
    setSource(from);
    setEverOpened(true);
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

  /**
   * THE UNPROMPTED INVITATION IS OFF, AND HOMEPAGE-ONLY WHEN ON.
   *
   * NOTIFY_AUTO_OPEN (lib/site-config.js) is the outer gate and is `false`
   * while the product is on sale: a launch-list modal that opens itself over
   * a live buy flow interrupts the decision it is standing in front of. The
   * flag is checked FIRST so that none of the machinery below — the timer,
   * the storage read, the busy-modal retry — ever starts; a disabled feature
   * that still schedules work is a disabled feature that can still surprise
   * you.
   *
   * Everything below is unchanged and comes back exactly as it was the
   * moment the flag flips.
   *
   * THE INVITATION IS ALSO HOMEPAGE-ONLY, independently of that gate.
   * It used to fire on every route after a delay, which put a launch-list
   * modal over the product page, the basket, the sign-in form and the
   * account area — i.e. over every screen where the visitor is already doing
   * something more valuable than joining a mailing list. Interrupting a
   * checkout to ask for an email address is the clearest way to lose both.
   *
   * The homepage is where someone is browsing rather than transacting, so it
   * is the one place an invitation is a fair trade. `pathname === '/'`
   * rather than a list of excluded routes: a deny-list silently fails open
   * for every page added later, and the next page added is far more likely
   * to be part of the shop than part of the story.
   *
   * This gates ONLY the automatic open. Every explicit "Notify Me" button
   * still calls `openNotify` directly and still works everywhere — a visitor
   * who asks for the modal must always get it.
   */
  useEffect(() => {
    if (!NOTIFY_AUTO_OPEN) return undefined;
    if (pathname !== '/') return undefined;

    try {
      if (window.localStorage.getItem(DISMISSED_KEY)) return undefined;
    } catch {
      // storage unavailable — treat as not dismissed and still invite
    }
    /*
     * NEVER OPEN ON TOP OF ANOTHER MODAL.
     *
     * The invitation fires on a timer, so it has no idea what the visitor
     * is doing when it lands. Since the buy sheet arrived (components/buy)
     * there is a surface it can collide with: press Buy at 7.9 seconds and
     * the newsletter modal opens over the top of it a tenth of a second
     * later — two dialogs, two focus traps, and Escape dismissing whichever
     * one happens to have bound its listener last.
     *
     * Choosing where to buy beats asking for an email address, so the
     * invitation WAITS rather than cancelling: the visitor still gets it,
     * just not over the thing they opened. Re-checking on an interval
     * rather than subscribing to the other provider keeps the two from
     * knowing about each other at all — any future modal is covered by the
     * same test, with no registration step to forget.
     */
    const anotherModalOpen = () =>
      document.querySelector('[role="dialog"][aria-modal="true"]') !== null;

    let retry;
    const invite = () => {
      if (anotherModalOpen()) {
        retry = setTimeout(invite, RETRY_WHILE_BUSY_MS);
        return;
      }
      openNotify(NOTIFY_SOURCES.timedInvitation);
    };

    const t = setTimeout(invite, AUTO_OPEN_DELAY_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(retry);
    };
  }, [openNotify, pathname]);

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
      {everOpened && (
        <NewsletterPopup
          open={open}
          source={source}
          onClose={closeNotify}
          onSubscribed={markSubscribed}
        />
      )}
    </NotifyContext.Provider>
  );
}
