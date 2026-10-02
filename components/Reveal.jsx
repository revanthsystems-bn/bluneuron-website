'use client';

import { motion } from 'framer-motion';

/**
 * Fades + slides content into view once it enters the viewport.
 * Wrap section headings, cards, or grids to give the whole site a
 * consistent premium scroll-in feel.
 *
 * `scale` is optional and off by default, so every existing caller behaves
 * exactly as before. Passing it (the spec boards in components/TechSpecs use
 * 1.04) adds a settle to the fade. It is folded into the SAME transform as the
 * y-slide rather than given its own wrapper — one composited transform per
 * element, and `prefers-reduced-motion` is already handled for all of them by
 * <MotionConfig reducedMotion="user"> in app/layout.jsx.
 */
export default function Reveal({
  children,
  className = '',
  style,
  delay = 0,
  y = 28,
  scale,
  once = true,
  amount = 0.2,
  as = 'div',
  // Anything else (event handlers, aria-*, id) passes straight through to the
  // motion element, so callers don't need an extra wrapper div just to attach
  // a listener to the thing that animates.
  ...rest
}) {
  const MotionTag = motion[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y, ...(scale === undefined ? {} : { scale }) }}
      whileInView={{ opacity: 1, y: 0, ...(scale === undefined ? {} : { scale: 1 }) }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
