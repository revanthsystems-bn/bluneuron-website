'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import NotifyFields from './notify/NotifyFields';
import NotifySuccess from './notify/NotifySuccess';
import { startLenis, stopLenis } from '@/lib/lenis';
import { SHOW_PRIVACY } from '@/lib/iriz';

/**
 * The signup modal. Presentational and controlled — components/notify/
 * NotifyProvider owns when it opens, whether that is the timed invitation or
 * a "Notify Me" click, so every CTA on the site lands on this exact form.
 *
 * NO IMAGE. The product panel that used to sit on the left is gone: this is a
 * two-field form, and half the modal spent on a render of the thing the
 * visitor is already looking at bought nothing but width.
 *
 * SCROLL LOCK has two halves and needs both. `overflow: hidden` on <body>
 * alone does not hold, because Lenis (components/SmoothScroll) writes
 * `scrollTop` every frame and simply puts the page back — so Lenis is stopped
 * too. See lib/lenis.js.
 *
 * FOCUS. On open, focus moves to the email field; Tab is trapped inside the
 * panel; Esc closes; and on close focus returns to whatever opened it, which
 * is captured at open time rather than passed in, so no caller has to
 * remember to hand over a ref.
 */
export default function NewsletterPopup({ open, source, onClose, onSubscribed }) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const panelRef = useRef(null);
  const emailRef = useRef(null);
  const openerRef = useRef(null);
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  // Each opening starts fresh — a visitor who closes the success view and
  // reopens later should get the form, not a stale confirmation.
  useEffect(() => {
    if (open) setDone(false);
  }, [open]);

  const handleSuccess = useCallback(() => {
    setDone(true);
    // Subscribed is remembered the same way a dismissal is, so the timed
    // invitation never interrupts someone who already signed up.
    onSubscribed?.();
  }, [onSubscribed]);

  // Remember the opener, then restore focus to it on close.
  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    const t = window.setTimeout(() => emailRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(t);
      const opener = openerRef.current;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [open]);

  // Scroll lock + Esc + focus trap.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    stopLenis();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap at both ends, and also pull focus back in if it has escaped the
      // panel entirely (which it has, on the very first Tab after open).
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      startLenis();
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose]);

  const ease = [0.16, 1, 0.3, 1];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[14px]"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease }}
            onClick={onClose}
          />

          {/* Below 500px this is a bottom sheet: full width, top corners only,
              sliding up from the edge. `pb-[env(safe-area-inset-bottom)]`
              keeps the last control clear of the home indicator. */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="notify-panel relative w-full max-w-[460px] overflow-hidden rounded-t-[28px] px-7 pb-[max(2rem,env(safe-area-inset-bottom))] pt-11 sm:rounded-[28px] sm:px-10 sm:pb-8"
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: reduced ? 0 : 0.25, ease }}
          >
            {/* Brand-blue light bleeding down from the top edge, and the
                1px catch-light along it. Both decorative. */}
            <span aria-hidden className="notify-panel-glow pointer-events-none absolute inset-x-0 top-0 h-48" />
            <span aria-hidden className="notify-panel-topline pointer-events-none absolute inset-x-0 top-0 h-px" />

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-5 top-5 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/12 text-white/55 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>

            <div className="relative">
              {/* Cross-fade, and both states are absolutely positioned against
                  the taller one so the panel does not jump mid-transition. */}
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.div
                    key="success"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.22, ease }}
                    className="py-2"
                  >
                    <NotifySuccess onDone={onClose} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.22, ease }}
                  >
                    <p className="notify-pill">
                      <span className="notify-dot" aria-hidden="true" />
                      Launching soon
                    </p>

                    <h2 id={titleId} className="type-display mt-5 text-[2rem] leading-[1.05] text-white">
                      Be the first to see <span className="notify-brand">IRIZ</span>.
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">
                      One message the day IRIZ launches. That&apos;s it.
                    </p>

                    <NotifyFields source={source} onSuccess={handleSuccess} emailRef={emailRef} />

                    <p className="mt-5 text-center text-[11px] leading-relaxed text-white/35">
                      No spam. Unsubscribe anytime.
                      {SHOW_PRIVACY && (
                        <>
                          {' '}
                          See our{' '}
                          <a
                            href="/legal/privacy"
                            className="underline underline-offset-2 transition-colors hover:text-white/60"
                          >
                            Privacy Policy
                          </a>
                          .
                        </>
                      )}
                    </p>

                    <div className="mt-4 text-center">
                      {/* Closes this instance only. Suppressing the timed
                          invitation for good is what `onSubscribed` does, and
                          that fires on a successful signup — not on a visitor
                          saying "later". */}
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-white/40 underline-offset-4 transition-colors hover:text-white/70 hover:underline"
                      >
                        Maybe later
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
