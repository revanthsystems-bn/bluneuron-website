'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MEDIA } from '@/lib/j500';
import Magnetic from './Magnetic';

const STORAGE_KEY = 'junuo-j500-popup-dismissed';
const DELAY_MS = 8000;

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable; popup will simply reappear next visit
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-panel relative grid w-full max-w-2xl grid-cols-1 overflow-hidden sm:grid-cols-2">
        <button
          aria-label="Close"
          onClick={dismiss}
          className="absolute right-4 top-4 z-10 rounded-full border border-border-subtle bg-black/40 p-1.5 text-white hover:bg-black/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="product-glow relative hidden items-center justify-center bg-black-obsidian p-6 sm:flex">
          <Image
            src={MEDIA.product.angleIso}
            alt="BluNeuron J500 projector"
            fill
            sizes="320px"
            className="product-fade relative z-10 object-contain p-6"
          />
        </div>

        <div className="p-8">
          <p className="eyebrow mb-3">Stay In The Loop</p>
          <h3 className="text-2xl font-bold tracking-tighter text-white">Get notified about the J500.</h3>
          <p className="mt-3 text-sm text-white/55">
            Sign up for the BluNeuron list — availability, firmware, and setup tips, no spam.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); dismiss(); }} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@email.com"
              className="w-full rounded-full border border-border bg-white/[0.04] px-5 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
            />
            <Magnetic as="button" type="submit" className="btn-primary w-full" strength={0.15}>
              Notify Me
            </Magnetic>
          </form>
          <button onClick={dismiss} className="mt-4 text-xs text-white/40 underline-offset-4 hover:text-white/70 hover:underline">
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
