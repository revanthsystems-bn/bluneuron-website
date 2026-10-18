'use client';

import { useEffect } from 'react';

/**
 * The four things every modal surface on this site has to do, in one hook.
 *
 * A panel that does fewer is worse than no panel: tab out of a drawer that
 * traps nothing and you are silently operating the page behind an opaque
 * overlay, with no way to see what has focus.
 *
 *   1. Escape closes.
 *   2. Focus moves inside on open, and returns to whatever opened it on
 *      close — including when the opener was removed while it was open.
 *   3. Focus stays inside while open (Tab and Shift+Tab both wrap).
 *   4. The page behind does not scroll.
 *
 * (4) IS TWO HALVES AND BOTH ARE REQUIRED. Lenis writes `scrollTop` every
 * animation frame, so `overflow: hidden` alone does not stop the page — it
 * simply gets overwritten on the next tick. `stopLenis()` is the other
 * half; it is a no-op when Lenis never mounted (reduced motion, SSR), so
 * there is nothing to branch on. See lib/lenis.js.
 *
 * @param {object}  opts
 * @param {boolean} opts.open        is the surface showing
 * @param {Function} opts.onClose    called on Escape
 * @param {object}  opts.panelRef    ref to the element focus is trapped in
 * @param {object}  [opts.initialFocusRef]  what to focus on open; defaults
 *                                   to the first tabbable node in the panel
 */
export default function useDialogBehaviour({ open, onClose, panelRef, initialFocusRef }) {
  useEffect(() => {
    if (!open) return undefined;

    const restoreTo = document.activeElement;
    const { overflow } = document.body.style;

    document.body.style.overflow = 'hidden';
    // Dynamic import keeps this hook usable in isolation and avoids a cycle.
    let released = false;
    import('@/lib/lenis').then((m) => {
      if (!released) m.stopLenis();
    });

    /** Tabbable nodes, recomputed per keypress — the panel's content moves. */
    const tabbables = () =>
      Array.from(
        panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = tabbables();
      if (nodes.length === 0) {
        // Nothing to focus: keep the ring out of the page behind us.
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and pull focus back in if it has escaped the
      // panel entirely (a click on the scrim, say).
      if (e.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    // One frame, so the panel is mounted and measurable before we focus it.
    const raf = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? tabbables()[0] ?? panelRef.current;
      target?.focus?.();
    });

    return () => {
      released = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      import('@/lib/lenis').then((m) => m.startLenis());
      // `isConnected` guards the case where the opener was unmounted while
      // the surface was open; focusing a detached node silently drops focus
      // to <body> and loses the keyboard user's place entirely.
      if (restoreTo instanceof HTMLElement && restoreTo.isConnected) restoreTo.focus();
    };
  }, [open, onClose, panelRef, initialFocusRef]);
}
