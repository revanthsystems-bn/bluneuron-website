'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Parses a spec string like "2,300", "4K", "<2s", "3,000,000:1" into
 * a prefix, an animatable numeric target, and a suffix.
 */
function parseNumeric(raw) {
  const match = raw.match(/^([^\d]*)([\d,]*\d)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const target = Number(numStr.replace(/,/g, ''));
  if (Number.isNaN(target)) return null;
  return { prefix, target, suffix, hasCommas: numStr.includes(',') };
}

export default function CountUp({ value, duration = 1.4, className = '' }) {
  const ref = useRef(null);
  const parsed = parseNumeric(String(value));
  const [display, setDisplay] = useState(() => (parsed ? `${parsed.prefix}0${parsed.suffix}` : value));

  useEffect(() => {
    if (!parsed || !ref.current) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplay(value);
      return undefined;
    }

    let frame;
    let started = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        const start = performance.now();

        const tick = (now) => {
          const t = Math.min((now - start) / (duration * 1000), 1);
          const eased = 1 - (1 - t) ** 3;
          const current = Math.round(parsed.target * eased);
          const formatted = parsed.hasCommas ? current.toLocaleString('en-US') : String(current);
          setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
          if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
