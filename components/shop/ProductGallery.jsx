'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * The product gallery: one large frame, a row of thumbnails under it.
 *
 * WHY THUMBNAILS AND NOT A CAROUSEL. A carousel hides how many images there
 * are and makes reaching the fourth one three gestures. Thumbnails state the
 * count, allow any order, and give a keyboard user a real tab stop per
 * image. The large frame is still swipeable in the sense that it scrolls
 * with the page — nothing here traps a gesture.
 *
 * THE FRAME IS A FIXED SQUARE and the images are `object-contain`, because
 * the shots are a mix: white-studio renders of the bare unit and a
 * photograph on a grey ground. Cropping to fill would cut the unit out of
 * one and leave the other floating. A declared aspect ratio also means
 * nothing reflows when a different image decodes.
 *
 * `shot.fade` marks the white-on-white renders that need the site's
 * `product-fade` mask to dissolve their backdrop into the page. The retail
 * photograph must NOT get it — its grey ground and its reflection are what
 * make it read as a photograph — which is exactly the distinction the MEDIA
 * block in lib/iriz.js documents.
 *
 * Only the first image is `priority`. It is what a visitor sees before any
 * interaction and is usually the page's largest paint; the others load when
 * their thumbnail does.
 */
export default function ProductGallery({ shots }) {
  const [active, setActive] = useState(0);
  const current = shots[active];

  return (
    <div>
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-3xl border border-border-subtle ${
          current.fade ? 'product-glow bg-black' : 'bg-black-soft'
        }`}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          sizes="(min-width: 1024px) 560px, 92vw"
          priority={active === 0}
          className={`object-contain ${current.fade ? 'product-fade' : ''}`}
        />
      </div>

      {/* `role="tablist"` is deliberately NOT used. These are not tabs — they
          do not reveal panels of different content, they change one image —
          and claiming the tab pattern would promise arrow-key navigation
          between them that this does not implement. A row of buttons with
          `aria-pressed` describes what this actually is. */}
      <ul className="mt-4 flex flex-wrap gap-3">
        {shots.map((shot, i) => (
          <li key={shot.src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}: ${shot.label}`}
              className={`relative h-16 w-16 overflow-hidden rounded-xl border transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft sm:h-20 sm:w-20 ${
                i === active
                  ? 'border-accent/60 bg-white/[0.06]'
                  : 'border-border-subtle bg-black-soft hover:border-white/20'
              }`}
            >
              <Image
                src={shot.src}
                alt=""
                fill
                sizes="80px"
                className={`object-contain p-1.5 ${shot.fade ? 'product-fade' : ''}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
