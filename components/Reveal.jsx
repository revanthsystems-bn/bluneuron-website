'use client';

import { motion } from 'framer-motion';

/**
 * Fades + slides content into view once it enters the viewport.
 * Wrap section headings, cards, or grids to give the whole site a
 * consistent premium scroll-in feel.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  y = 28,
  once = true,
  amount = 0.2,
  as = 'div',
}) {
  const MotionTag = motion[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
