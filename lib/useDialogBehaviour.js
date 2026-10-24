'use client';

import { useEffect } from 'react';
import { startLenis, stopLenis } from '@/lib/lenis';

/**
 * Everything a modal dialog has to do besides draw itself: lock the page,
 * trap Tab, close on Escape, and give focus back when it goes away.
 *
 * WHY A HOOK. components/NewsletterPopup had all of this inline, and the buy
 * sheet needs exactly the same four behaviours. Two copies of a focus trap is
 * two things to get subtly different — and the half that goes wrong is never
 * the visible half, it is Escape binding twice or focus landing on <body>.
 *
 * SCROLL LOCK HAS TWO HALVES AND NEEDS BOTH. `overflow: hidden` on <body>
 * does not stop this site scrolling: Lenis (components/SmoothScroll) writes
 * the scroll position every frame and simply puts it back on the next tick.
 * So the lock also tells Lenis to stand down, and lib/lenis.js no-ops when
 * Lenis never mounted (reduced motion, SSR) so callers never have to check.
 *
 * THE DIALOG OWNS THE LOCK, not whatever renders it. That is deliberate and
 * was a real bug once: with the lock in a provider AND in the modal, effects
 * clean up child-first, so closing restored `body.overflow` to '' in the
 * modal and then back to the 'hidden' the provider had captured a moment
 * earlier. The page stayed locked after every close.
 *
 * @param {object}  o
 * @param {boolean} o.open      is the dialog showing
 * @param {Function} o.onClose  called on Escape and on scrim click
 * @param {object}  o.panelRef  ref to the panel that holds the focus trap
 * @param {object}  [o.initialFocusRef] what to focus on open; defaults to the
 *                                      first focusable thing in the panel
 */
export default function useDialogBehaviour({ open, onClose, panelRef, initialFocusRef }) {
  // ---- Focus in, and focus back out -----------------------------------
  useEffect(() => {
    if (!open) return undefined;

    // Captured BEFORE focus moves, so the restore target is the control that
    // opened the dialog and not something inside it.
    const opener = document.activeElement;

    // A frame's grace: the panel mounts with an entry animation, and
    // focusing an element mid-transform makes some browsers scroll to it.
    const t = window.setTimeout(() => {
      const target =
        initialFocusRef?.current ||
        panelRef.current?.querySelector(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      target?.focus();
    }, 60);

    return () => {
      window.clearTimeout(t);
      // `document.contains` guards the case where the opener was itself
      // unmounted while the dialog was up — focusing a detached node throws
      // the focus to <body>, which is worse than leaving it alone.
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [open, panelRef, initialFocusRef]);

  // ---- Scroll lock, Escape, and the Tab trap --------------------------
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    stopLenis();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = [
        ...panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap at both ends — and pull focus back in if it has escaped the
      // panel entirely, which is what happens when the browser's own chrome
      // or an extension has moved it.
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      startLenis();
    };
  }, [open, onClose, panelRef]);
}
