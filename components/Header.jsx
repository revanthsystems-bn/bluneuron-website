'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring } from 'framer-motion';
import Magnetic from './Magnetic';

const NAV_ITEMS = [
  { label: 'Overview', href: '#showcase' },
  { label: 'Highlights', href: '#highlights' },
  { label: 'Specs', href: '#specs' },
  { label: 'Compare', href: '#compare' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 300, damping: 40 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border-subtle backdrop-blur-glass transition-colors duration-300 ${
        scrolled ? 'bg-black/90' : 'bg-black/80'
      }`}
    >
      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 top-0 h-px origin-left bg-accent" />
      <div
        className={`section-container flex items-center justify-between transition-[height] duration-300 ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        <motion.a
          href="/"
          className="flex items-center gap-2.5"
          aria-label="BluNeuron home"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Image src="/brand/logo-mark.png" alt="" width={32} height={32} preload className="h-8 w-auto" />
          <Image
            src="/brand/wordmark-white.png"
            alt="BluNeuron"
            width={1715}
            height={327}
            preload
            className="h-5 w-auto"
          />
        </motion.a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Magnetic as="a" href="#buy" className="btn-primary hidden px-5 py-2.5 text-xs sm:inline-flex" strength={0.15}>
            Buy Now
          </Magnetic>
          <button
            aria-label="Toggle menu"
            className="rounded-full p-2 text-white/80 hover:bg-white/5 hover:text-white lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-subtle bg-black lg:hidden">
          <nav className="section-container flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#buy"
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-2 justify-center"
            >
              Buy Now
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
