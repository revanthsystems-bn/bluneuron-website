'use client';

import Image from 'next/image';
import Reveal from './Reveal';
import { COMPARISON, PRODUCT_SHOT, productPlate } from '@/lib/iriz';

const DEFAULT_COLUMNS = COMPARISON.columns;
const DEFAULT_ROWS = COMPARISON.rows;

/**
 * A yes/no mark, drawn rather than imported.
 *
 * Both glyphs are the same 16x16 box, the same 1.8 stroke and the same round
 * caps, so the column reads as one set of marks and not as two icon families
 * that happen to sit near each other.
 *
 * THE PATH IS DRAWN IN THE SERVER HTML. This used to be a framer-motion svg
 * with `initial={{ pathLength: 0, opacity: 0 }}`, which React serialised as an
 * inline `opacity:0` on every mark in the table — so with no bundle the whole
 * "IRIZ has it" column rendered blank, which is worse than no table at all: it
 * reads as a feature the product does not have. The draw-on is now the
 * `.tick-path` rule in app/globals.css, keyed off the enclosing <Reveal>'s
 * data-reveal-in and gated behind html.js-anim like every other animation on
 * the site. Without the class the path is simply a finished mark.
 *
 * `role="img"` plus the label, because an icon is the ENTIRE content of these
 * cells. Without it a screen reader reads an empty cell and the row's answer
 * is lost — and "—" (what `false` used to render) is not an answer either, it
 * is the absence of one.
 */
function Mark({ yes }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label={yes ? 'Yes' : 'No'}
      className={yes ? 'text-accent-soft' : 'text-white/35'}
    >
      <path
        className="tick-path"
        d={yes ? 'M2.5 8.5L6 12l7.5-8' : 'M4 4l8 8M12 4l-8 8'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cell({ value }) {
  if (value === true) return <Mark yes />;
  if (value === false) return <Mark yes={false} />;
  return <span className="text-white/75">{value}</span>;
}

/**
 * The IRIZ column's header: the product, then its name.
 *
 * The product photograph sits on a dark ground here and is an OPAQUE shot on
 * a white seamless, so it is mounted on a small rounded card filled with its
 * own backdrop colour. See PRODUCT_SHOT in lib/iriz.js.
 *
 * IT REPLACES A "MOST POPULAR" BADGE. That badge was a popularity claim
 * nothing on this site supports: there is one product, no sales ranking and
 * no reviews to rank it by. The column is worth highlighting because it is
 * ours and the page is about it — which the product's own name and picture
 * say honestly, and a superlative does not.
 */
function IrizMark({ name }) {
  return (
    <span className="flex items-center gap-2.5">
      {/* The asset's real pixels, read from PRODUCT_SHOT rather than typed
          here. The box is a fixed 36x36 square and `object-contain` is what
          keeps the product undistorted inside it — the attributes are the
          asset's own 3:2 ratio, so the intrinsic size next/image reasons
          about is the truth rather than a square guess.

          `sizes="72px"` buys the 2x variant: at 36px a 1x file is 36x24 of
          real pixels, which is a smudge rather than a product. It costs a
          couple of KB as AVIF.

          The span carries the photo's own ground, so the letterboxing a 3:2
          source leaves in a square box does not show as dark bands. It
          disappears with `plate: null`. */}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={productPlate()}
      >
        <Image
          src={PRODUCT_SHOT.src}
          alt=""
          aria-hidden="true"
          width={PRODUCT_SHOT.width}
          height={PRODUCT_SHOT.height}
          sizes="72px"
          className="h-full w-full object-contain"
        />
      </span>
      <span>{name}</span>
    </span>
  );
}

export default function ComparisonTable({
  eyebrow = 'IRIZ vs. The Rest',
  heading = 'Not all "500 lumens" are the same.',
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  showViewMore = true,
}) {
  const highlighted = columns.find((c) => c.highlight) ?? columns[0];
  const others = columns.filter((c) => c !== highlighted);

  // The tint that marks our column, on the header and on every cell under it.
  const hl = 'bg-accent-soft/[0.055]';

  return (
    <section id="compare" className="border-b border-border-subtle bg-black py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="mb-10">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">{heading}</h2>
        </Reveal>

        {/* ------------------------------------------------------------- *
         * PHONE: one card per row. No table, and no scroller either.
         *
         * The table below needs 640px to stay legible and a 375px phone does
         * not have it. The usual answer is to let the table scroll sideways
         * inside its panel, which keeps the PAGE from scrolling but still
         * asks someone to drag a grid back and forth to read two values —
         * and the second column is the one that falls off the edge, so the
         * comparison is exactly the part that goes missing.
         *
         * A card per row puts both answers on screen at once, which is the
         * only thing this table is for. Hidden from md up, where the real
         * table takes over; `md:hidden` rather than a separate component so
         * the two cannot drift apart.
         * ------------------------------------------------------------- */}
        <Reveal delay={0.1} as="ul" className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <li key={row.label} className="glass-panel p-5">
              <p className="text-sm font-semibold text-white">{row.label}</p>

              {/* Label ABOVE value, not beside it. Side by side, "Typical
                  Budget Projector" wrapped to three lines against a
                  right-aligned value that wrapped to two, and every card came
                  out a different ragged shape. Stacked and left-aligned, the
                  column names sit on one line each and the values start from
                  a common edge. */}
              <dl className="mt-4 flex flex-col gap-2">
                <div className={`flex flex-col gap-1 rounded-xl p-3 ${hl}`}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-soft">
                    {highlighted.name}
                  </dt>
                  <dd className="text-sm text-white">
                    <Cell value={row[highlighted.key]} />
                  </dd>
                </div>

                {others.map((col) => (
                  <div key={col.key} className="flex flex-col gap-1 p-3">
                    <dt className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                      {col.name}
                    </dt>
                    <dd className="text-sm text-white/70">
                      <Cell value={row[col.key]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </Reveal>

        {/* ------------------------------------------------------------- *
         * md AND UP: the real table.
         *
         * `overflow-x-auto` stays as the last resort for a narrow tablet in
         * portrait — it scrolls the PANEL, never the page, which is the
         * distinction that matters. At md the 640px minimum already fits.
         * ------------------------------------------------------------- */}
        <Reveal delay={0.1} className="hidden glass-panel overflow-x-auto md:block">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th scope="col" className="p-5 font-medium text-white/55">
                  <span className="sr-only">Feature</span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`p-5 font-semibold ${
                      col.highlight ? `text-white ${hl}` : 'text-white/70'
                    }`}
                  >
                    {col.highlight ? <IrizMark name={col.name} /> : col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={`transition-colors duration-200 hover:bg-accent-soft/[0.06] ${
                    i % 2 === 0 ? 'bg-white/[0.015]' : ''
                  }`}
                >
                  {/* A ROW HEADER, not a data cell. The left column names what
                      each row compares, which is exactly what `<th scope="row">`
                      is for — and without it every cell in the table is a value
                      with nothing saying what it is a value OF, which is what
                      axe's td-has-header rule reports. */}
                  <th
                    scope="row"
                    className="border-t border-border-subtle p-5 text-left font-medium text-white/55"
                  >
                    {row.label}
                  </th>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-t border-border-subtle p-5 ${col.highlight ? hl : ''}`}
                    >
                      <Cell value={row[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        {showViewMore && (
          <Reveal delay={0.15} className="mt-8 text-center">
            <a
              href="/compare"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-accent-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
            >
              See the full comparison →
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}
