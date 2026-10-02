'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * One-time page-load transition: the logo mark scales/fades in, then the
 * overlay lifts to reveal the page. Skipped under prefers-reduced-motion,
 * and only ever plays once per browser session.
 *
 * React's dev-only Strict Mode runs this effect twice on mount (run,
 * cleanup, run again) to surface missing cleanup. The "should this play"
 * decision is cached in a ref on the first invocation instead of being
 * re-read from sessionStorage each time — otherwise the second invocation
 * would see the flag *this same effect* just wrote, skip scheduling a new
 * hide timer, and leave the overlay stuck on screen forever, blocking
 * every click on the page.
 */
export default function PageIntro() {
  const [visible, setVisible] = useState(false);
  const decidedRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (decidedRef.current === null) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const alreadySeen = window.sessionStorage.getItem('bluneuron-intro-seen') === '1';
      decidedRef.current = !reduced && !alreadySeen;
      if (decidedRef.current) window.sessionStorage.setItem('bluneuron-intro-seen', '1');
    }

    if (!decidedRef.current) return undefined;

    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/brand/logo-mark.png" alt="" width={56} height={56} className="h-14 w-auto" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
