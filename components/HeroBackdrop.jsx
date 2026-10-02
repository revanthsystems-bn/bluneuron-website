'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MEDIA } from '@/lib/iriz';

const LOOP = MEDIA.heroLoop;

/**
 * The hero's full-bleed 4s loop — the white-studio shot, handheld.
 *
 * Nothing in here grades or masks the footage: the hero's white ground is
 * held down by the flat veil and the two scrims in components/Hero.jsx, and
 * deliberately not by a filter on this element, so the reduced-motion poster
 * below gets exactly the same treatment as the video.
 *
 * Under reduced motion this renders NO <video> element at all — just the
 * poster. A paused video at 100svh is worse than useless: dropping
 * `controls` on it puts a browser control bar across the entire hero, and
 * leaving them off gives a dead element. The poster frame stands in.
 *
 * Three states, not two. `pending` is the first client render, before the
 * media query has been read; it shows the poster. Only once we positively
 * know the visitor has *not* asked for reduced motion do we swap in the
 * video. A plain `useState(false)` + effect would mount the video for one
 * frame for reduced-motion users — exactly the people who must never get it.
 *
 * The poster is the video's own frame 0, so the swap is invisible.
 */
export default function HeroBackdrop() {
  const videoRef = useRef(null);
  const [mode, setMode] = useState('pending'); // 'pending' | 'motion' | 'still'

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMode(mq.matches ? 'still' : 'motion');
    sync();
    // Listen for changes too — the visitor can flip the OS setting mid-visit.
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Pause once scrolled past, so the loop costs nothing down the page.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || mode !== 'motion') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Autoplay can still be refused before any interaction; the poster
          // attribute covers that case.
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  if (mode !== 'motion') {
    return (
      <Image
        src={LOOP.poster}
        alt={LOOP.description}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover object-center"
      poster={LOOP.poster}
      aria-label={LOOP.description}
      // muted + playsInline are both required or iOS refuses to autoplay.
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
    >
      <source src={LOOP.webm} type="video/webm" />
      <source src={LOOP.mp4} type="video/mp4" />
    </video>
  );
}
