import Image from 'next/image';
import Reveal from './Reveal';
import { BOX_CONTENTS, BOX_PHOTO, BOX_SUMMARY } from '@/lib/iriz';

/**
 * "In the box" — the printed retail carton beside what is actually inside it.
 *
 * WHAT THIS REPLACED, AND WHY. This section used to be a single photograph of
 * the unit standing next to its box, under the heading "The IRIZ, and the box
 * it ships in." — a picture of a box, captioned as a picture of a box. It
 * named what the image showed and stopped there, so a visitor who wanted to
 * know what they were paying for had to read the carton in the photograph.
 * The contents list was on /specs, behind SHOW_PENDING_SPECS, hidden, and
 * inferred from marketing copy rather than from the box.
 *
 * Now the box is one half and the manifest is the other, and every row of it
 * is read off the printed carton (BOX_CONTENTS in lib/iriz.js). The model
 * number BNA-510SH appears on the page for the first time here, because the
 * box is where it is printed.
 *
 * THE PHOTO FILLS THE CARD. No inner padding and no max-width: the image IS
 * the card, clipped to the same 22px radius, so this reads as one clean photo
 * tile rather than a small picture mounted inside a dark frame.
 *
 * The card's aspect ratio is the PHOTO's own, read from BOX_PHOTO rather
 * than hard-coded, so a re-shoot at a different ratio moves the card with
 * it. At the photo's exact ratio `object-cover` has nothing to crop, so the
 * carton is never shaved at the edges — the cover is there to keep the fit
 * safe, not to do work today.
 *
 * THE SOURCE RESOLUTION PROBLEM IS FIXED. This used to be a 603x588 file
 * with a note asking for a re-shoot at 1600px or wider; the photograph here
 * now is 1254x1254. At the widest this section goes (a 1024px container, two
 * columns, 56px gap) the image renders at ~484 CSS px, so it is comfortably
 * past 1:1 even on a 2x display.
 *
 * NO PLATE HERE, unlike every other product surface. This photograph is the
 * tile — full-bleed, clipped to the card's radius — so its light ground is
 * the design rather than something to be matched or hidden. `productPlate()`
 * is for the shots that float inside a frame; see PRODUCT_SHOT in
 * lib/iriz.js.
 *
 * ICONS ARE INLINE SVG, not lucide-react, even though lucide is already a
 * dependency and TrustBadges uses it. In v1.47 every lucide icon renders
 * through Icon.mjs, which is marked "use client" and reads a React context —
 * importing one here would turn this server component into a client boundary
 * to draw five static shapes. Same call the footer already documents for its
 * brand marks: five glyphs do not justify a module graph. They are drawn on
 * lucide's own grid (24x24, 1.75 stroke, round caps) so they sit at the same
 * visual weight as the icons elsewhere on the site.
 */

/**
 * One outline glyph per box item, keyed by BOX_CONTENTS' `icon` string — the
 * same string-key-to-icon indirection TrustBadges uses, so the content file
 * never imports from a component.
 *
 * `aria-hidden` lives on the tile that wraps these, not on the paths: each
 * icon sits beside its own visible title, so it is decorative and must not be
 * announced twice.
 */
const ICONS = {
  // Body, lens, a vent slot, and the two feet of the stand.
  projector: (
    <>
      <rect x="2" y="7" width="20" height="11" rx="3" />
      <circle cx="9" cy="12.5" r="3" />
      <path d="M16.5 10.5h2" />
      <path d="M6.5 18v2M17.5 18v2" />
    </>
  ),
  // A slim handset: one round key above a stack of buttons.
  remote: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="3" />
      <circle cx="12" cy="7" r="1.5" />
      <path d="M10 12.5h4M10 16.5h4" />
    </>
  ),
  // A two-pin plug with its lead.
  adapter: (
    <>
      <path d="M9 2v5M15 2v5" />
      <path d="M6 7h12v4.5a6 6 0 0 1-12 0V7Z" />
      <path d="M12 17.5V22" />
    </>
  ),
  // An open booklet.
  guide: (
    <>
      <path d="M2.5 5H8a3 3 0 0 1 3 3v11.5a2.5 2.5 0 0 0-2.5-2.5h-6V5Z" />
      <path d="M21.5 5H16a3 3 0 0 0-3 3v11.5a2.5 2.5 0 0 1 2.5-2.5h6V5Z" />
    </>
  ),
  // A card with a question mark on it.
  faq: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="M9.9 10.1a2.2 2.2 0 1 1 3.05 2.03c-.62.27-.95.8-.95 1.42v.25" />
      <path d="M12 16.4h.01" />
    </>
  ),
};

function BoxIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      {ICONS[name]}
    </svg>
  );
}

export default function ProductShowcase() {
  return (
    <section
      id="product-shot"
      className="border-b border-border-subtle bg-black-soft py-20 scroll-mt-20"
    >
      <div className="section-container">
        <Reveal className="mb-10 text-center lg:mb-14">
          <p className="eyebrow mb-3">In the box</p>
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            Everything you need, in one box.
          </h2>
        </Reveal>

        {/* Two columns from lg, one below it, and the photo is FIRST in DOM
            order — which is both the mobile stacking order asked for and the
            reading order a screen reader gets. `items-center` rather than
            `items-start`: the list is shorter than the photo card, and
            top-aligning it leaves the right column hanging. */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
          {/* LEFT — the carton */}
          <Reveal delay={0.05}>
            {/* `overflow-hidden` is what clips the photo to the 22px radius —
                without it the image's own square corners sit proudly outside
                the card's rounded ones. The aspect ratio is the photo's, so
                the box below is exactly the shape of what goes in it. */}
            <div
              className="relative overflow-hidden rounded-[22px] border border-white/10 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.9)]"
              style={{ aspectRatio: `${BOX_PHOTO.width} / ${BOX_PHOTO.height}` }}
            >
              <Image
                src={BOX_PHOTO.src}
                alt={BOX_PHOTO.alt}
                width={BOX_PHOTO.width}
                height={BOX_PHOTO.height}
                loading="lazy"
                sizes="(min-width: 1024px) 484px, (min-width: 640px) 60vw, 90vw"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>

          {/* RIGHT — what is inside it */}
          <Reveal delay={0.12}>
            {/* An <h3>, not a <p>: this labels the list beneath it and sits
                under the section's own <h2>, so it is a real heading that
                happens to be styled as an eyebrow. */}
            <h3 className="eyebrow mb-5">What&rsquo;s inside</h3>

            <ul className="divide-y divide-border-subtle border-y border-border-subtle">
              {BOX_CONTENTS.map((item) => (
                <li key={item.title} className="flex items-center gap-4 py-4">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-accent-soft"
                  >
                    <BoxIcon name={item.icon} />
                  </span>
                  {/* min-w-0 so a long sub-line wraps inside the row instead
                      of pushing the row wider than the column — which is what
                      would put a horizontal scrollbar on a 390px screen. */}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{item.title}</span>
                    {item.note && (
                      <span className="mt-0.5 block text-xs text-white/55">{item.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs text-white/55">{BOX_SUMMARY}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
