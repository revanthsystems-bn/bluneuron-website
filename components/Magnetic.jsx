'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Wraps any element in a subtle magnetic cursor-pull: the element eases
 * toward the pointer while it's inside, and springs back on leave.
 * Transform-only (GPU-cheap) and disabled under prefers-reduced-motion.
 */
export default function Magnetic({ children, as = 'div', strength = 0.3, className = '', ...rest }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 22, mass: 0.5 });
  const MotionTag = motion[as] ?? motion.div;

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
