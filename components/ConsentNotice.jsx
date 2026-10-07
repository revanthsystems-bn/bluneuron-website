'use client';

import { useEffect, useState } from 'react';
import { SHOW_PRIVACY } from '@/lib/iriz';

const STORAGE_KEY = 'bluneuron-consent-ack';

/**
 * Where the bar is allowed to appear, in priority order — the first of these
 * present in the DOM becomes the trigger, and it shows once that element
 * scrolls into view.
 *
 * This is a landmark, NOT a scroll distance, because scroll distance cannot
 * express the actual requirement. The bar is `fixed bottom-0`, so it must not
 * appear while a full-height section owns the viewport, and this page has
 * three of them — Hero (`min-h-svh`), LensZoom (`h-[320vh]` with a sticky
 * `h-screen` frame) and ThrowRange (`h-[280vh]` with a sticky `h-svh` frame).
 * The last of those ends around 8060px into an 11300px page, so even "70% of
 * total height" still fires inside it, and any percentage would drift the
 * moment a section is added or removed. A landmark below all three cannot.
 *
 * `#compare` and `#buy` are home-page sections; `footer` is the backstop and
 * exists on every page via PageShell. Pages other than the home page have no
 * full-height sections at all, so an early trigger there is harmless.
 *
 * If you add a new full-height section, it must go ABOVE the first landmark
 * in this list, or the bar will clip it — add the new section's own id to the
 * front of this list instead of reaching for a scroll offset.
 */
const LANDMARKS = ['#compare', '#buy', 'footer'];

/**
 * The privacy switch (SHOW_PRIVACY, lib/iriz.js) is read HERE rather than at
 * the render site in app/layout.jsx, and this wrapper exists so that it can
 * be: a conditional `return null` has to sit above every hook, and the bar's
 * own hooks are in the component below. Off, that component never mounts, so
 * no landmark query and no IntersectionObserver ever run — rather than
 * mounting, observing, and then rendering nothing.
 */
export default function ConsentNotice() {
  if (!SHOW_PRIVACY) return null;
  return <ConsentNoticeBar />;
}

function ConsentNoticeBar() {
  const [acknowledged, setAcknowledged] = useState(true);
  const [pastTop, setPastTop] = useState(false);

  useEffect(() => {
    try {
      setAcknowledged(Boolean(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      setAcknowledged(false);
    }
  }, []);

  // Reveal on the first landmark that exists, and stay revealed — scrolling
  // back up must not yank the bar away mid-read.
  useEffect(() => {
    const target = LANDMARKS.reduce(
      (found, selector) => found || document.querySelector(selector),
      null
    );
    if (!target) {
      // No landmark at all (an unexpected page shape) — fail open rather than
      // silently never showing a privacy notice.
      setPastTop(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPastTop(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const dismiss = () => {
    setAcknowledged(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable; notice will simply reappear next visit
    }
  };

  if (acknowledged || !pastTop) return null;

  // bottom-[4.25rem] below lg: StickyBuyBar owns bottom-0 there and is long
  // since visible by the time this appears, so this stacks on top of it
  // rather than over it. At lg+ the buy bar is hidden and this drops to the
  // edge.
  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-0 bottom-[4.25rem] z-[60] border-t border-border-subtle bg-black-surface/95 backdrop-blur-glass lg:bottom-0"
    >
      <div className="section-container flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-xs leading-relaxed text-white/60">
          We use your email address only to send the updates you sign up for, and to respond if you contact
          support — submissions are processed by our third-party form provider. See our{' '}
          <a href="/legal/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </a>{' '}
          for details.
        </p>
        <button
          onClick={dismiss}
          className="btn-secondary shrink-0 px-5 py-2 text-xs"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
