'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HIGHLIGHT_BOARDS } from '@/lib/iriz';

/**
 * The mobile (<md) presentation of the four boards: a swipe carousel.
 *
 * NO CAROUSEL LIBRARY, and no scroll-position maths driving the transform
 * either. The track is an ordinary horizontally-scrollable element with CSS
 * scroll snapping, so the swipe is the browser's own: native momentum, native
 * rubber-banding, native accessibility, and it keeps working with JS disabled
 * (you simply lose the dots). The only thing JS does here is READ which card is
 * centred, so the dots can say so.
 *
 * That read is an IntersectionObserver against the track itself rather than a
 * scroll handler doing arithmetic — no listener firing on every frame of a
 * flick, and no hard-coded card width to keep in sync with the CSS.
 *
 * NO HORIZONTAL PAGE SCROLL. The track is `w-full` with `overflow-x-auto`, so
 * it can never be wider than its parent; the cards overflow *inside* it. The
 * side padding is what lets the first and last card reach the centre —
 * 11vw + 78vw + 11vw = 100vw — rather than any negative margin, which is the
 * usual way this pattern leaks a scrollbar onto <body>.
 */

export default function HighlightCarousel() {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const cards = [...track.querySelectorAll('[data-card]')];
    const observer = new IntersectionObserver(
      (entries) => {
        // The most-visible card wins. Taking the first intersecting entry
        // instead would flicker between two cards mid-swipe, because the
        // peeking neighbour is intersecting the whole time.
        let best = null;
        for (const entry of entries) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
        if (best && best.intersectionRatio > 0.5) {
          setActive(cards.indexOf(best.target));
        }
      },
      { root: track, threshold: [0.5, 0.75, 1] }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const goTo = (i) => {
    const card = trackRef.current?.querySelectorAll('[data-card]')[i];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className="md:hidden">
      <div
        ref={trackRef}
        className="hl-track flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-[11vw] pb-2"
        // A scrollable region with no focusable children is keyboard-operable
        // only if it is itself focusable; the label tells a screen reader what
        // it is scrolling through.
        tabIndex={0}
        role="group"
        aria-label="Product highlights, swipe to browse"
      >
        {HIGHLIGHT_BOARDS.map((board, i) => (
          <div
            key={board.image}
            data-card
            className="w-[78vw] shrink-0 snap-center"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${HIGHLIGHT_BOARDS.length}`}
          >
            {/* Natural height inside the card: intrinsic width/height with
                `w-full h-auto`, so the card is exactly as tall as the artwork.
                No feather below md — the artwork is the card, edge to edge, so
                there is no bare tile to blend into. */}
            <div className="img-tile">
              <Image
                src={board.image}
                alt={board.alt}
                width={board.width}
                height={board.height}
                sizes="78vw"
                className="img-tile-media h-auto w-full"
                preload={false}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {HIGHLIGHT_BOARDS.map((board, i) => (
          <button
            key={board.image}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to highlight ${i + 1}`}
            aria-current={i === active}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? 'w-5 bg-white/80' : 'w-1.5 bg-white/25'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
