'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { MEDIA } from '@/lib/iriz';

const LOOP = MEDIA.heroLoop;

/**
 * The hero's full-bleed 4s loop.
 *
 * ---------------------------------------------------------------------
 * NO MORE IMAGE -> VIDEO SWAP, and that is the whole change.
 *
 * This used to render three states: a `pending` first paint showing the
 * poster as a next/image, then — once a `useEffect` had read
 * `prefers-reduced-motion` — either a <video> or the poster on its own. The
 * reasoning was sound (never mount a video for someone who asked for reduced
 * motion, not even for one frame) but the cost was severe and measured:
 *
 *   - The poster <img> was REMOVED from the DOM at hydration. It is the
 *     largest thing on the screen, so it was the LCP candidate — and
 *     destroying a candidate means Chrome falls back to timing whatever
 *     else is left, which on this page was a 53px "SCROLL" label.
 *   - Between the swap and the video's first decoded frame the hero painted
 *     its own background and nothing else. On a Lighthouse mobile trace the
 *     homepage was BLACK until ~2.9s.
 *
 * The <video> is now server-rendered with its `poster` attribute, so the
 * first paint is the poster frame — no swap, no hydration dependency, and a
 * real LCP candidate that is in the initial HTML.
 *
 * REDUCED MOTION IS STILL HONOURED, just not by withholding the element.
 * `autoPlay` is never set; the effect below starts playback only when the
 * visitor has not asked for reduced motion, and stops it if they change the
 * setting mid-visit. A video that is never played shows its poster and
 * nothing moves — which is the same outcome the old `still` branch produced,
 * reached without throwing away the paint.
 *
 * `preload="metadata"`, not `"auto"`: the bytes are wanted, but not ahead of
 * the poster and the rest of the page. The IntersectionObserver below starts
 * the fetch in earnest by calling play() once the hero is actually on screen.
 */
export default function HeroBackdrop() {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Only ever observe while motion is allowed. Under reduced motion the
    // element simply sits on its poster frame.
    let observer = null;

    const sync = () => {
      observer?.disconnect();
      observer = null;

      if (mq.matches) {
        el.pause();
        // Back to the poster frame rather than a frozen mid-loop still, so
        // a visitor who turns the setting on mid-visit gets the composed
        // frame and not whatever happened to be on screen.
        try {
          el.currentTime = 0;
        } catch {
          // Seeking before metadata has arrived throws; the poster is
          // showing either way.
        }
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Autoplay can still be refused before any interaction; the
            // poster attribute covers that case.
            el.play().catch(() => {});
          } else {
            // Paused once scrolled past, so the loop costs nothing down the
            // page.
            el.pause();
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(el);
    };

    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      {/*
        A REAL <img> UNDER THE VIDEO, not just the `poster` attribute.
        =============================================================
        Chrome does not reliably treat a <video poster> as a Largest
        Contentful Paint candidate, so with only the attribute the hero was
        invisible to the metric and LCP fell through to a 53px "SCROLL"
        label elsewhere on the page — a number that measured nothing anyone
        was waiting for.
        This element is a genuine LCP candidate, it is in the initial HTML,
        it is `priority` so it is preloaded, and it is NEVER removed — the
        video simply paints over it once it has a frame. That also means the
        hero is never black: the poster is on screen from the first paint,
        which is what the filmstrip showed was missing.
        `aria-hidden`, because the <video> beside it already carries the
        accessible description and two announcements of the same frame is
        one too many.
      */}
      <Image
        src={LOOP.poster}
        alt=""
        aria-hidden="true"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="hero-media-frame object-cover"
      />

      <video
      ref={videoRef}
      className="hero-media-frame absolute inset-0 h-full w-full object-cover"
      // NO `poster` ATTRIBUTE. The <Image> above already paints this exact
      // frame, optimised — and with both in place the browser fetched the
      // poster TWICE: 10KB as an AVIF through next/image, and 69KB again as
      // the raw JPEG for this attribute, the two competing for the same
      // early bandwidth. Measured on a Lighthouse trace before this line
      // was removed.
      aria-label={LOOP.description}
      // muted + playsInline are both required or iOS refuses to play inline.
      // There is deliberately no `autoPlay`: the effect above starts it, and
      // only when reduced motion has not been asked for.
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source src={LOOP.webm} type="video/webm" />
      <source src={LOOP.mp4} type="video/mp4" />
      </video>
    </>
  );
}
