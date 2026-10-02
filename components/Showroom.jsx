'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import PriceTag from './PriceTag';
import BuyButtons from './BuyButtons';
import { HERO, MEDIA } from '@/lib/iriz';

export default function Showroom() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '75% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay can be blocked before user interaction; the poster frame covers this.
      });
    }
  }, [inView]);

  return (
    <section id="showcase" ref={sectionRef} className="relative h-screen w-screen overflow-hidden bg-black-obsidian">
      {inView && (
        <video
          ref={videoRef}
          src={MEDIA.video.ambient}
          aria-label="Ambient loop of the BluNeuron IRIZ projecting light"
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}

      {/* Dark gradient scrim so the overlaid typography stays legible over any video frame */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black-obsidian via-black-obsidian/30 to-black-obsidian/60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black-obsidian/70 via-transparent to-black-obsidian/70" />

      <div className="section-container relative z-10 flex h-full flex-col items-center justify-center text-center">
        <Reveal amount={0.5}>
          <p className="eyebrow mb-4">{HERO.eyebrow}</p>
        </Reveal>
        <Reveal amount={0.5} delay={0.08}>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tighter text-white sm:text-7xl lg:text-8xl">
            Step into the light.
          </h1>
        </Reveal>
        <Reveal amount={0.5} delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/60 sm:text-lg">{HERO.body}</p>
        </Reveal>
        <Reveal amount={0.5} delay={0.2} className="mt-8">
          <PriceTag size="lg" align="center" />
        </Reveal>
        <Reveal amount={0.5} delay={0.28} className="mt-8">
          <BuyButtons className="flex flex-wrap justify-center gap-3" />
        </Reveal>
        <Reveal amount={0.5} delay={0.34} className="mt-5">
          <a
            href={HERO.ctaSecondary.href}
            className="text-sm font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            {HERO.ctaSecondary.label} →
          </a>
        </Reveal>
      </div>

      <Reveal
        amount={0.5}
        delay={0.4}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/60"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
      </Reveal>
    </section>
  );
}
