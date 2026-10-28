import Image from 'next/image';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import {
  FULL_SPEC_SHEET, BOX_CONTENTS, SHOW_PENDING_SPECS, MEDIA, THROW_RANGE,
  PRODUCT_SHOT, productPlate,
} from '@/lib/iriz';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
// WARRANTY from site-config, not from lib/iriz. The placeholder object that
// used to live there — "Warranty terms have not been finalized for launch",
// with an amber "placeholder only" badge — is deleted; these are the
// published terms, and they are the same ones /legal/warranty renders.
import { WARRANTY } from '@/lib/site-config';

// The groups this page actually renders. Everything still lives in
// FULL_SPEC_SHEET; the pending-detail groups are filtered out here rather than
// removed from the data, so SHOW_PENDING_SPECS alone brings them back.
// See SHOW_PENDING_SPECS in lib/iriz.js.
const SPEC_GROUPS = FULL_SPEC_SHEET.filter((group) => SHOW_PENDING_SPECS || !group.pending);

// Bento spans for the spec groups, on the 12-column board. Rows must total 12,
// so these change in pairs — and there is one set per flag state, because the
// group count changes with it:
//
//   pending shown   7+5 / 5+7 / 12 — the four dense groups pair off by size,
//                   and "Dimensions & Weight" (two placeholder rows) closes
//                   the board as a wide strip rather than a mostly-empty
//                   column. `lg:col-span-12` is also what splits that group's
//                   list into two columns, via `wide` below.
//   pending hidden  7+5 / 5+7 — the four dense groups, two even rows, no
//                   trailing cell to fill and nothing wide.
//
// THE SECOND ROW IS 5+7, NOT 7+5, and that is the size pairing above doing
// its job rather than an inconsistency. The spans follow FULL_SPEC_SHEET's
// own order — Optics, Throw, Platform, Connectivity — and the row counts are
// 6 / 4 / 6 / 8. Connectivity & Audio became the longest group when the two
// wireless radios and the adapter's mains rating were read off the carton
// into it, so it takes the wide cell and Platform the narrow one. Grid items
// stretch to their row, so the alternative was an 8-row list in a half-width
// tile forcing matching dead space into the 6-row tile beside it. Re-check
// these two if a group gains or loses rows again.
const GROUP_SPANS = SHOW_PENDING_SPECS
  ? ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-12']
  : ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'];

/**
 * The four numbers the page opens with.
 *
 * Every one is already a row in FULL_SPEC_SHEET below — this is the same
 * sheet's headline, not a second set of claims, and the `row` key names the
 * row each is lifted from so the two cannot drift apart. Four, because that
 * is what fits on one line of a phone in two columns without the values
 * wrapping.
 *
 * `THROW_RANGE` supplies the screen range rather than a typed string, for the
 * same reason the homepage reads it: the dial, the prose and this block must
 * never be able to quote different sizes.
 */
const HEADLINE = [
  { row: 'Brightness', value: '500', unit: 'True ANSI lumens' },
  { row: 'Native Resolution', value: '1080p', unit: 'Native 1920x1080' },
  {
    row: 'Screen Size Range',
    value: `${THROW_RANGE.max.size}"`,
    unit: `Max, at ${THROW_RANGE.max.distance}m`,
  },
  { row: 'Throw Ratio', value: '1:1', unit: `${THROW_RANGE.min.distance}m-${THROW_RANGE.max.distance}m` },
];

export const metadata = pageMetadata({
  title: 'IRIZ Full Specifications — 1080p, 500 ANSI Lumens | BluNeuron',
  // Describes what the page actually lists, which the flag decides. Promising
  // "dimensions, box contents, and warranty" while they are hidden would be a
  // description search engines show for content that is not there.
  description: SHOW_PENDING_SPECS
    ? 'Full specifications for the BluNeuron IRIZ mini projector: native 1080p optics, 500 ANSI lumens, connectivity, dimensions, box contents and warranty.'
    : 'Full specifications for the BluNeuron IRIZ mini projector: native 1080p optics and display, throw and screen size, Android 14 platform and connectivity.',
  path: '/specs',
});

export default function SpecsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Full Spec Sheet"
        title="Every spec, in one place."
        subtitle="The complete technical breakdown for the BluNeuron IRIZ — no rounding, no marketing shorthand."
        image={MEDIA.product.shot}
        imagePosition="62% 50%"
      />

      {/* THE HEADLINE BLOCK.
          It is here to close a gap: the hero's copy ended well above its own
          bottom edge, and the spec board below opens with its own padding, so
          the page put roughly 180px of empty black between the title and the
          first number on a 1440 screen. A page called "Every spec, in one
          place" should not make you scroll past nothing to reach one.

          The product photograph sits on a dark ground here, and it is an
          OPAQUE shot on a white seamless — so it is mounted on a card filled
          with its own backdrop colour rather than floated bare. See
          PRODUCT_SHOT in lib/iriz.js.

          `lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]` rather than fr/fr —
          the product is a fixed-ish object and the numbers want the rest, and
          `minmax(0,...)` on both tracks is what stops a long value forcing
          the grid wider than its container. */}
      <section className="border-b border-border-subtle bg-black py-12 sm:py-14">
        <div className="section-container grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
          <Reveal
            y={20}
            className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl lg:mx-0 lg:max-w-none"
            style={productPlate()}
          >
            {/* THE ASSET'S OWN PIXELS, from PRODUCT_SHOT rather than typed
                here. These two numbers were once 760x760, which is not the
                shape of any file we have ever shipped: an <img> takes its
                aspect ratio from its width/height attributes, so
                `h-auto w-full` resolved to a SQUARE box and the projector
                was drawn 1.42x too tall on this route. Reading them from
                the one object that owns the asset is what stops that
                happening again when the file is re-shot.

                The wrapper is now a rounded card carrying the photo's own
                ground (`productPlate()`), because this source is opaque;
                `overflow-hidden` clips the photo's square corners to the
                card's radius. Both vanish when a transparent asset lands —
                `plate: null` in lib/iriz.js. */}
            <Image
              src={PRODUCT_SHOT.src}
              alt=""
              aria-hidden="true"
              width={PRODUCT_SHOT.width}
              height={PRODUCT_SHOT.height}
              sizes="(min-width: 1024px) 420px, 360px"
              className="h-auto w-full"
              priority={false}
            />
          </Reveal>

          {/* Two columns on a phone, four from sm. `items-stretch` plus
              `h-full` so the four tiles share a height whatever their unit
              lines do. */}
          <ul className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4">
            {HEADLINE.map((item, i) => (
              <Reveal
                key={item.row}
                as="li"
                y={20}
                delay={Math.min(i, 3) * 0.05}
                className="h-full"
              >
                <div className="bento-tile flex h-full flex-col justify-end p-5">
                  {/* A THIRD size, below `.stat-number-sm`, and it is measured
                      rather than picked: these tiles are a quarter of the
                      right-hand column and only 193px wide inside their
                      padding at 1440 — the narrowest stat on the site. At the
                      44px `.stat-number-sm` top end "1080p" renders 205px and
                      was clipped by the tile's own `overflow-hidden`. 36px
                      puts it at 168px with room to spare, at every width.

                      It is also why all four values here are SHORT. "Android
                      14" needed 378px and no sane size fixes that in a 193px
                      box; the platform is a headline on the homepage and a
                      row in the Platform card below, and this block is the
                      four numbers. */}
                  <p className="stat-number whitespace-nowrap text-[clamp(1.75rem,2.4vw,2.25rem)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-white/55">
                    {item.unit}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* `border-b` stays with this section, not with the one below it: it is
          the hairline above the closing "View Comparison" block, and that
          block is what follows whether or not the pending section renders. */}
      <section className="bg-black py-16 sm:py-20">
        <div className="section-container bento-grid">
          {SPEC_GROUPS.map((group, i) => {
            const span = GROUP_SPANS[i] ?? 'lg:col-span-6';
            // Both keyed off the full-width span, not off "is this the last
            // group": with the pending group hidden the last group is an
            // ordinary half-width tile, and `sm:col-span-2` on it would
            // stretch it across the two-column phone/tablet board.
            const wide = span === 'lg:col-span-12';
            const smSpan = wide ? 'sm:col-span-2' : '';
            return (
              <Reveal
                key={group.group}
                delay={Math.min(i, 3) * 0.05}
                y={20}
                className={`bento-tile p-6 sm:p-8 ${smSpan} ${span}`}
              >
                <h2 className="mb-5 text-lg font-semibold text-white">{group.group}</h2>
                <dl className={wide ? 'grid gap-x-10 sm:grid-cols-2' : 'divide-y divide-border-subtle'}>
                  {group.rows.map(([label, value]) => (
                    <div
                      key={label}
                      className={`flex items-start justify-between gap-6 py-3 ${
                        wide
                          ? 'border-b border-border-subtle last:border-b-0 sm:border-b-0 sm:py-0'
                          : 'first:pt-0 last:pb-0'
                      }`}
                    >
                      <dt className="text-sm text-white/50">{label}</dt>
                      <dd className="text-right text-sm font-medium text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* NO LONGER GATED ON SHOW_PENDING_SPECS, and both halves are why.
          "In the Box" was unconfirmed when this gate went up and is not any
          more — BOX_CONTENTS is read off the printed carton (see the note on
          it in lib/iriz.js), which is the most reliable source there is for a
          packing list. The warranty was the other reason, and the terms are
          now published. Two confirmed tiles have no business being hidden on
          the page a buyer opens to check exactly these things.

          SHOW_PENDING_SPECS still gates the unmeasured spec ROWS further up
          (Dimensions & Weight), which is the one thing left that it should. */}
      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container bento-grid">
          <Reveal y={20} className="bento-tile p-6 sm:p-8 lg:col-span-7">
            <h2 className="mb-5 text-lg font-semibold text-white">In the Box</h2>
            {/* BOX_CONTENTS carries rows ({ icon, title, note }), not plain
                strings — it is read off the printed carton now and the
                homepage section renders it with icon tiles. This list stays
                a plain bulleted one: it is a spec-sheet tile beside the
                warranty card, not the showcase. The sub-line is appended
                after an em dash rather than set on its own line, so a row
                here stays one row. See BOX_CONTENTS in lib/iriz.js. */}
            <ul className="space-y-2.5 text-sm text-white/70">
              {BOX_CONTENTS.map((item) => (
                <li key={item.title} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft" aria-hidden="true" />
                  <span>
                    {item.title}
                    {item.note && <span className="text-white/55">{' — ' + item.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.05} y={20} className="bento-tile p-6 sm:p-8 lg:col-span-5">
            <h2 className="mb-5 text-lg font-semibold text-white">Warranty</h2>
            {/* THE TENURE, THE CLOCK IT RUNS ON, AND A LINK TO THE TERMS.
                Three lines rather than a summary paragraph, because those
                are the three things someone checks here — and the link
                matters most: a warranty claim on a spec sheet that cannot
                be checked is decoration. */}
            <p className="text-2xl font-bold tracking-tight text-white">{WARRANTY.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Manufacturer cover from the date on your invoice — not the delivery date, and not
              the date you registered the unit. Return-to-base service.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/55">{WARRANTY.accessories}</p>
            {/* A 44px TARGET THAT DOES NOT LOOK LIKE ONE. As plain 14px text
                this measured 277x20 — under the 44x44 WCAG 2.2 asks of a
                target, and an awkward tap on a phone. It is a standalone
                link at the end of a tile, not an inline link inside a
                paragraph, so the criterion's inline exemption does not cover
                it. `min-h-[44px] items-center` grows the BOX to 44 while the
                text stays where it was; `mt-2` in place of `mt-5` and `-mb-3`
                give back the 24px the box added, so nothing moves. Change the
                three together or the tile reflows. */}
            <a
              href={ROUTES.warranty}
              className="mt-2 -mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-white underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
            >
              Read the warranty policy →
            </a>
        </Reveal>
        </div>
      </section>

      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <Reveal>
            <p className="text-sm text-white/50">
              See how these numbers stack up against typical budget projectors.
            </p>
            <a href="/compare" className="btn-secondary mt-5 inline-flex">
              View Comparison →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
