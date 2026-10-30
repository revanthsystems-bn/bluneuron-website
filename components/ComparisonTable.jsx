'use client';

import Image from 'next/image';
import Reveal from './Reveal';
import StoreButtons from './buy/StoreButtons';
import {
  COMPARISON,
  COMPARISON_FEATURED_ROWS,
  COMPARISON_SUBLINE,
  PRODUCT_SHOT,
  USE_CASES,
  productPlate,
} from '@/lib/iriz';
import { MARKETPLACE, SHOW_BUY } from '@/lib/site-config';

const DEFAULT_COLUMNS = COMPARISON.columns;
const DEFAULT_ROWS = COMPARISON_FEATURED_ROWS;

/* ------------------------------------------------------------------ *
 * THE GLYPHS
 * ------------------------------------------------------------------ *
 *
 * ONE FAMILY, DRAWN HERE, KEYED BY STRING. `icon` on a COMPARISON row and on
 * a USE_CASES entry is a KEY and not a component — the same arrangement
 * BOX_CONTENTS uses with components/ProductShowcase, and for the same
 * reason: lib/iriz.js stays pure content and imports nothing from a
 * component.
 *
 * Every path is drawn in a 24x24 box, stroked at 1.5 with round caps and no
 * fill, so the row rail and the use-case strip read as one set rather than as
 * two icon families that happen to sit near each other. That also matches the
 * footer's globe and the masthead's icons, which are the site's other
 * hand-drawn glyphs.
 *
 * AN UNKNOWN KEY DRAWS NOTHING AND COSTS NOTHING. `Glyph` returns null rather
 * than a fallback box, and every caller lays the label out independently — so
 * a row with a misspelled or missing `icon` still states its label and its two
 * values. A missing decoration must never cost a comparison row.
 */
const GLYPHS = {
  // --- Comparison rows -------------------------------------------------
  // Brightness: a lamp, not a sun. The row is about measured output from a
  // light source, and a sun reads as "outdoor use" — a claim not made here.
  brightness: 'M12 3v2M5.6 5.6l1.4 1.4M3 12h2M19 12h2M17 7l1.4-1.4M9.5 15a4 4 0 1 1 5 0c-.6.5-.9 1.2-.9 2h-3.2c0-.8-.3-1.5-.9-2ZM10 20h4',
  // Resolution: a frame with a pixel grid inside it.
  resolution: 'M3 5h18v14H3zM3 12h18M12 5v14',
  // Smart OS: a chip with legs, which is what "Android 14 on an H723" is.
  os: 'M8 8h8v8H8zM4 10V9m0 6v-1M20 10V9m0 6v-1M10 4h1m3 0h1M10 20h1m3 0h1M4 9h16v6H4z',
  // Keystone: a trapezoid squared to a rectangle — the correction itself.
  keystone: 'M4 7l16-3v16L4 17zM20 4v16',
  // Focus: a lens ring closing on a point. Drawn as a circle inside a circle
  // with four short tick marks, which reads as "focusing" rather than as a
  // camera — the row is about the picture coming sharp, not about optics
  // hardware. Added 30 Oct 2026 with the "Auto focus" row.
  focus: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM12 2v2M12 20v2M2 12h2M20 12h2',
  // Audio: a speaker with one arc. One arc, not three: this is a 5W mono
  // speaker and a three-arc "loud" glyph would overstate it.
  audio: 'M4 9v6h3l4 4V5L7 9H4zM15.5 9.5a3.5 3.5 0 0 1 0 5',
  // Video playback: a play triangle in a frame.
  video: 'M3 6h18v12H3zM10 9.5l5 2.5-5 2.5z',
  // Screen size: a screen with a diagonal measure.
  screen: 'M3 5h18v11H3zM12 16v3M9 19h6M6 13l9-6',
  // Price, when COMMERCE_ENABLED puts that row back.
  price: 'M3 7h18v10H3zM7 7v10M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  // /compare's extra rows.
  apps: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  chip: 'M9 9h6v6H9zM5 11V9m0 6v-2M19 11V9m0 6v-2M11 5h1m2 0h1M11 19h1m2 0h1M5 9h14v6H5z',
  distance: 'M4 12h16M4 9v6M20 9v6M9 12l2-2m-2 2 2 2m6-2-2-2m2 2-2 2',

  // --- Use cases -------------------------------------------------------
  cinema: 'M4 6h16v12H4zM8 18v2M16 18v2M9 10.5l4 2-4 2z',
  party: 'M5 20l5-11 5 11zM14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 9l.7 1.3L21 11l-1.3.7L19 13l-.7-1.3L17 11l1.3-.7z',
  hotel: 'M4 20V5h10v15M14 9h6v11M7 8h1M11 8h1M7 12h1M11 12h1M7 16h1M11 16h1M17 13h1M17 17h1',
  office: 'M4 4h16v12H4zM12 16v4M8 20h8M8 11l2.5-2.5L13 11l3-3',
  // "Movies & gaming" — a film frame, not a gamepad. The claim behind this
  // entry is an HDMI input a console can be plugged into (see USE_CASES in
  // lib/iriz.js); a gamepad glyph would read as a gaming FEATURE, which is
  // not what the spec sheet supports.
  play: 'M4 5h16v14H4zM4 9h16M4 15h16M8 5v4M16 5v4M8 15v4M16 15v4',
};

/** One glyph, or nothing at all. See the note above. */
function Glyph({ name, className = 'h-[18px] w-[18px]' }) {
  const d = GLYPHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The generic projector that stands for the other column.
 *
 * DRAWN, AND THAT IS A HARD REQUIREMENT, not a convenience. The column is
 * labelled "Typical budget projector" and the cell beside it says the
 * resolution is upscaled and the lumens claim is inflated — put a real
 * competitor's product photograph there and the section becomes a named
 * comparative claim about an identifiable product. So this is a projector
 * nobody makes: a box, a lens, a vent and a foot.
 *
 * Also why it is grey rather than tinted. The IRIZ column carries the brand
 * blue and a photograph of the actual unit; this one is deliberately the
 * quieter of the two, because it is a category and not a product.
 */
function GenericProjector({ className = 'h-9 w-9' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="15" width="38" height="20" rx="4" />
      <circle cx="18" cy="25" r="6" />
      <circle cx="18" cy="25" r="2" />
      <path d="M32 21h6M32 25h6M32 29h6" />
      <path d="M12 35v4M36 35v4" />
    </svg>
  );
}

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
      className={yes ? 'text-accent-soft' : 'text-white/55'}
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

function Cell({ value, tone = 'text-white/75' }) {
  if (value === true) return <Mark yes />;
  if (value === false) return <Mark yes={false} />;
  return <span className={tone}>{value}</span>;
}

/**
 * The headline, with one phrase in the brand blue.
 *
 * A SUBSTRING PROP RATHER THAN JSX FROM THE CALLER, so the heading stays a
 * plain string everywhere it is passed and there is still exactly one copy of
 * it. `highlight` is looked up in `heading`; if it is absent — which is the
 * case on /compare, whose heading is a different sentence — the whole string
 * renders plainly and nothing has to be conditional at the call site.
 *
 * Split on the FIRST occurrence only. A phrase that appeared twice would
 * otherwise tint both, and the second one is never the one that was meant.
 */
function Heading({ heading, highlight }) {
  const at = highlight ? heading.indexOf(highlight) : -1;
  if (at === -1) return heading;
  return (
    <>
      {heading.slice(0, at)}
      <span className="text-accent-soft">{highlight}</span>
      {heading.slice(at + highlight.length)}
    </>
  );
}

/**
 * THE COLUMN CARD — the thing that makes this read as two products rather
 * than as a grid of text.
 *
 * It is rendered INSIDE a `<th scope="col">`, not above the table, and that
 * is deliberate: the card IS the column header, so a screen reader announces
 * "BluNeuron IRIZ" when it reads a value in that column. Lifting the cards
 * out into a sibling grid above a headerless table would look identical and
 * break that association completely.
 *
 * The IRIZ side carries the product photograph. It is an OPAQUE shot on a
 * white seamless, so it is mounted on its own backdrop colour via
 * `productPlate()` — see PRODUCT_SHOT in lib/iriz.js. `sizes` asks for a 2x
 * file: at 56px a 1x source is 56x37 real pixels, which is a smudge rather
 * than a product. The attributes are the asset's own 3:2 ratio, so the
 * intrinsic box the browser reserves is the truth rather than a square guess,
 * and `object-contain` is what keeps the unit undistorted inside the square.
 *
 * IT REPLACES A "MOST POPULAR" BADGE. That badge was a popularity claim
 * nothing on this site supports: there is one product, no sales ranking and
 * no reviews to rank it by. The column is worth highlighting because it is
 * ours and the page is about it — which the product's own name and picture
 * say honestly, and a superlative does not.
 */
function ColumnCard({ name, highlight, compact = false }) {
  const box = compact ? 'h-12 w-16' : 'h-20 w-28';

  const art = highlight ? (
    // THE GLOW IS A SIBLING, NOT A BACKGROUND ON THE PLATE. The poster lights
    // the unit from behind with a blue bloom; the plate itself has to stay
    // the asset's own flat #FEFEFE (see productPlate) or the opaque
    // photograph's white rectangle fights the gradient. So the bloom is an
    // absolutely-positioned blur UNDER the plate, and `plate: null` on a
    // future transparent asset leaves it looking even better rather than
    // breaking it.
    <span className="relative flex items-center justify-center">
      <span
        aria-hidden="true"
        className={`absolute rounded-full bg-accent/30 blur-2xl ${
          compact ? 'h-12 w-20' : 'h-20 w-36'
        }`}
      />
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${box}`}
        style={productPlate()}
      >
        <Image
          src={PRODUCT_SHOT.src}
          alt=""
          aria-hidden="true"
          width={PRODUCT_SHOT.width}
          height={PRODUCT_SHOT.height}
          sizes="224px"
          className="h-full w-full object-contain"
        />
      </span>
    </span>
  ) : (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/35 ${box}`}
    >
      <GenericProjector className={compact ? 'h-7 w-7' : 'h-10 w-10'} />
    </span>
  );

  return (
    <span className="flex flex-col items-center gap-3 text-center">
      {art}
      <span
        className={`font-semibold leading-tight ${compact ? 'text-[13px]' : 'text-base'} ${
          highlight ? 'text-white' : 'text-white/70'
        }`}
      >
        {name}
      </span>
    </span>
  );
}

/**
 * THE COLUMN TINTS, declared once and shared by the table and the phone
 * cards, so the two layouts cannot drift apart visually.
 *
 * TUNED TO THE POSTER (design-src/marketing/iriz-vs-budget.png): ours is a
 * lit blue panel with a bright edge, theirs is flat charcoal. The poster's
 * contrast between the two columns is most of what makes it read as a
 * comparison at a glance, and the first pass here was far too timid —
 * accent/7 against white/3.5 on black is two barely-different greys.
 *
 * The literal strings matter: Tailwind scans source text, so a class
 * assembled at runtime would never be generated.
 */
const TINT = {
  // Ours: brand blue, and a visible edge. `border-accent/45` is on the left
  // and right of EVERY cell in the column, with the top only on the header
  // and the bottom only on the last row — which is what draws one continuous
  // card edge down the column. It needs `border-separate`; with collapsed
  // borders the per-cell radii are ignored outright.
  iriz: 'bg-accent/[0.13] border-x border-accent/45',
  other: 'bg-white/[0.055] border-x border-white/10',
};

export default function ComparisonTable({
  eyebrow = 'IRIZ vs. The Rest',
  heading = 'Not all "500 lumens" are the same.',
  /** The phrase inside `heading` to set in the brand blue. See Heading. */
  highlight = '500 lumens',
  subheading = COMPARISON_SUBLINE,
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  showViewMore = true,
  showUseCases = true,
  showStores = true,
}) {
  const highlighted = columns.find((c) => c.highlight) ?? columns[0];
  const others = columns.filter((c) => c !== highlighted);
  const last = rows.length - 1;

  return (
    /*
     * A LIT ROOM, NOT A FLAT BLACK BAND.
     *
     * The poster sits the whole comparison in a dark cinema-blue space with
     * the light coming from behind the product. Reproduced here as two
     * pointer-events-none washes over a near-black base rather than as a
     * photograph: a background image would be another megabyte to ship and
     * would fight the text at every breakpoint.
     *
     * The base stays `bg-black-obsidian` — near enough to the neighbouring
     * sections that the page rhythm is unbroken — and the blue is a wide,
     * very low-opacity radial. Deliberately restrained: this is behind body
     * copy and a data table, and the poster is not.
     */
    <section
      id="compare"
      className="relative overflow-hidden border-b border-border-subtle bg-black-obsidian py-20 scroll-mt-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(59,130,246,0.16)_0%,rgba(59,130,246,0.04)_38%,rgba(0,0,0,0)_72%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-noise" />

      <div className="section-container relative">
        <Reveal className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            <Heading heading={heading} highlight={highlight} />
          </h2>
          {subheading && (
            <p className="mt-4 text-[15px] leading-relaxed text-white/60 sm:text-base">
              {subheading}
            </p>
          )}
        </Reveal>

        {/* ------------------------------------------------------------- *
         * PHONE: the two cards, then one card per row. No table, and no
         * scroller either.
         *
         * The table below needs 640px to stay legible and a 360px phone does
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
         *
         * THE TWO COLUMN CARDS ARE REPEATED HERE, compact, as a two-up
         * header. They are `aria-hidden` and the stacked rows below name
         * their own columns in a <dt>, so nothing is announced twice.
         * ------------------------------------------------------------- */}
        <div className="md:hidden">
          <Reveal className="grid grid-cols-2 gap-3" aria-hidden="true">
            <div className="rounded-2xl border border-accent/45 bg-accent/[0.13] p-4">
              <ColumnCard name={highlighted.name} highlight compact />
            </div>
            {others.map((col) => (
              <div
                key={col.key}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
              >
                <ColumnCard name={col.name} highlight={false} compact />
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1} as="ul" className="mt-3 flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.label} className="glass-panel p-5">
                <p className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.04] text-accent-soft">
                    <Glyph name={row.icon} className="h-[18px] w-[18px]" />
                  </span>
                  {row.label}
                </p>

                {/* Label ABOVE value, not beside it. Side by side, "Typical
                    budget projector" wrapped to three lines against a
                    right-aligned value that wrapped to two, and every card
                    came out a different ragged shape. Stacked and
                    left-aligned, the column names sit on one line each and
                    the values start from a common edge.

                    OURS FIRST, every time. The row is read as "what we give
                    you, versus what you would otherwise get". */}
                <dl className="mt-4 flex flex-col gap-2">
                  <div className="flex flex-col gap-1 rounded-xl border border-accent/30 bg-accent/[0.13] p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-soft">
                      {highlighted.name}
                    </dt>
                    <dd>
                      <Cell
                        value={row[highlighted.key]}
                        tone="text-[15px] font-semibold text-white"
                      />
                    </dd>
                  </div>

                  {others.map((col) => (
                    <div key={col.key} className="flex flex-col gap-1 p-3">
                      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-white/40">
                        {col.name}
                      </dt>
                      <dd className="text-sm">
                        <Cell value={row[col.key]} tone="text-white/60" />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </Reveal>
        </div>

        {/* ------------------------------------------------------------- *
         * md AND UP: the real table.
         *
         * `border-separate border-spacing-0` AND NOT `border-collapse`, and
         * it is not a style preference. The two column cards are drawn out
         * of per-cell borders and radii (see TINT above), and a collapsed
         * table ignores `border-radius` on cells completely — the cards come
         * out as hard-cornered blocks. Separate borders with zero spacing
         * look exactly like a collapsed table and keep the radii.
         *
         * `overflow-x-auto` stays as the last resort for a narrow tablet in
         * portrait — it scrolls the PANEL, never the page, which is the
         * distinction that matters. At md the 640px minimum already fits.
         * ------------------------------------------------------------- */}
        <Reveal delay={0.1} className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            {/* The feature rail is fixed and the two value columns split what
                is left evenly, so the cards are the same width whatever the
                longest value happens to be. */}
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[37%]" />
              <col className="w-[37%]" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="p-5 align-bottom font-medium">
                  <span className="sr-only">Feature</span>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`rounded-t-3xl border-t p-6 pb-7 align-bottom font-semibold ${
                      col.highlight ? `${TINT.iriz} border-t-accent/45` : `${TINT.other} border-t-white/10`
                    }`}
                  >
                    <ColumnCard name={col.name} highlight={col.highlight} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className="group">
                  {/* A ROW HEADER, not a data cell. The left column names what
                      each row compares, which is exactly what `<th scope="row">`
                      is for — and without it every cell in the table is a value
                      with nothing saying what it is a value OF, which is what
                      axe's td-has-header rule reports. */}
                  <th
                    scope="row"
                    className="border-t border-border-subtle py-4 pl-0 pr-5 text-left font-medium text-white/70"
                  >
                    {/* THE ICON SITS IN ITS OWN TILE, which is the poster's
                        arrangement: a rail of square glyph chips down the
                        left edge rather than an icon leaning against each
                        label. A fixed 38px box is what makes them line up
                        when the labels are different lengths. */}
                    <span className="flex items-center gap-3.5">
                      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-white/[0.04] text-accent-soft transition-colors duration-200 group-hover:border-accent/40 group-hover:bg-accent/10">
                        <Glyph name={row.icon} className="h-[19px] w-[19px]" />
                      </span>
                      {row.label}
                    </span>
                  </th>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-t px-5 py-4 transition-colors duration-200 ${
                        col.highlight
                          ? `${TINT.iriz} border-t-accent/30 group-hover:bg-accent/[0.17]`
                          : `${TINT.other} border-t-white/10 group-hover:bg-white/[0.075]`
                      } ${i === last ? 'rounded-b-3xl border-b' : ''} ${
                        i === last && col.highlight ? 'border-b-accent/45' : ''
                      } ${i === last && !col.highlight ? 'border-b-white/10' : ''}`}
                    >
                      {/* OURS IS SET LIKE A HEADLINE, THEIRS LIKE BODY COPY.
                          The poster's single loudest move: the IRIZ answer is
                          large and bold, the other column's is plain. Kept
                          WHITE rather than blue-on-blue — the poster tints
                          some of its values, and on this panel that lands
                          between 3:1 and 4:1 against the tinted ground. The
                          blue is carried by the panel, the border, the icon
                          rail and the tick instead. */}
                      <Cell
                        value={row[col.key]}
                        tone={
                          col.highlight
                            ? 'text-[15px] font-semibold text-white'
                            : 'text-white/60'
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        {/* ------------------------------------------------------------- *
         * WHERE PEOPLE PUT IT.
         *
         * A strip of rooms, not of features — the rule is written out at
         * USE_CASES in lib/iriz.js and it is the reason "screen mirroring"
         * is not here. A `<ul>`, because it is a list of things and a row of
         * bare <div>s announces as nothing at all.
         * ------------------------------------------------------------- */}
        {showUseCases && USE_CASES.length > 0 && (
          <Reveal delay={0.15} className="mt-12 border-t border-border-subtle pt-10">
            <h3 className="eyebrow mb-7 text-center">Made for</h3>
            {/* BARE GLYPHS ON THE GROUND, no card around each one — the
                poster runs them as a single rail along its foot and the
                borders were what made the first pass read as five more
                buttons under a table that already had buttons. The circle
                is the only chrome, and it is what keeps the rail legible
                when the labels wrap to two lines at 360. */}
            <ul className="grid grid-cols-3 gap-x-2 gap-y-7 sm:grid-cols-5">
              {USE_CASES.map((useCase) => (
                <li key={useCase.label} className="flex flex-col items-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent-soft">
                    <Glyph name={useCase.icon} className="h-[22px] w-[22px]" />
                  </span>
                  <span className="max-w-[11ch] text-[13px] font-medium leading-snug text-white/70">
                    {useCase.label}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* ------------------------------------------------------------- *
         * AVAILABLE ON.
         *
         * components/buy/StoreButtons, which is the ONE place that decides
         * whether a store link may render — a URL still carrying the
         * PLACEHOLDER marker, or a marketplace withheld by AMAZON.live, is
         * absent from it rather than present-and-broken. So this strip names
         * Amazon when and only when there is an Amazon listing to open, and
         * `sellersAnd()` in the line underneath cannot name a store the
         * buttons refuse to link to.
         *
         * Gated on SHOW_BUY for the same reason every other buy affordance
         * is: while that is false the site is not offering a purchase path
         * anywhere, and a comparison table is not the place to be the
         * exception.
         * ------------------------------------------------------------- */}
        {showStores && SHOW_BUY && (
          <Reveal delay={0.2} className="mt-12 flex flex-col items-center border-t border-border-subtle pt-10">
            {/* A RULE EITHER SIDE, as the poster sets its "LIVE ON" lockup.
                `aria-hidden` spans rather than an <hr>: they are two short
                decorative strokes flanking a heading, not a thematic break
                in the document. */}
            <h3 className="eyebrow mb-5 flex items-center gap-4">
              <span aria-hidden="true" className="h-px w-10 bg-border-strong" />
              Available on
              <span aria-hidden="true" className="h-px w-10 bg-border-strong" />
            </h3>
            <StoreButtons
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
              buttonClassName="w-full sm:w-auto"
              tones={['btn-primary', 'btn-secondary']}
            />
            {/* MARKETPLACE.fulfilmentNote, not a sentence written here. The
                buy card and /where-to-buy already state this and it must
                read identically on all three — and it names the sellers
                through the same helper the buttons do, so it cannot promise
                delivery from a store the buttons do not offer. */}
            {/* `text-white/55` AND NOT QUIETER, at 12px, for the measured
                reason the footer's legal line carries the same value: on
                black, white/45 at this size is 4.42:1 and fails WCAG AA,
                while white/55 is 6.2:1. scripts/ui-audit.mjs runs axe over
                this page and reported exactly that on the first draft of
                this line. Who handles a refund is not the text to make hard
                to read. */}
            <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-white/55">
              {MARKETPLACE.fulfilmentNote}
            </p>
          </Reveal>
        )}

        {showViewMore && (
          <Reveal delay={0.25} className="mt-10 text-center">
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
