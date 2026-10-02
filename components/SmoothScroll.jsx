'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenis } from '@/lib/lenis';

/**
 * Buttery-smooth scroll, mounted once at the root. Renders nothing.
 * Skipped entirely under prefers-reduced-motion so motion-sensitive
 * users get native, instant scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Lenis drives the scroll position every frame, so anything that moves
      // the page by other means — a bare `#id` link, `scrollIntoView`,
      // `window.scrollTo` — is overwritten on the next rAF tick and the page
      // never moves. Handing anchors to Lenis is what makes in-page links
      // work at all here; without it the hero's own scroll cue and every
      // `href="#…"` on the site are inert.
      anchors: true,
    });

    // Published so the modal's scroll lock can pause it — see lib/lenis.js.
    setLenis(lenis);

    let frame;
    function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
