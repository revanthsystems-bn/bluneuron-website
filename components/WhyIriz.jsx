import Reveal from './Reveal';
import { BRAND, THROW_RANGE } from '@/lib/iriz';

/**
 * "Why IRIZ" — design L, "light beam": a centred header standing in a soft
 * projector beam, over six glass cards.
 *
 * WHY IT EXISTS. Everything above it states the product in fragments: a
 * hero claim, six highlight tiles, a dial, a spec table, a comparison grid.
 * That is the right shape for someone scanning, and it is the wrong shape
 * for the two readers who decide late — the person weighing this against a
 * cheaper projector with a bigger number on the box, and a search engine
 * with no picture to read. Both need the connective tissue: not "500 ANSI
 * lumens" but what an ANSI lumen is and why the other number is bigger.
 *
 * WHAT REPLACED WHAT. This was the Option-F light banner (a photograph of
 * the product on a #eeeff1 card) over six #121317 cards. Both are gone, and
 * with them the only photograph in this section — `why-iriz-banner.jpg` is
 * deleted in the same commit, because this component was its only consumer
 * and an unreferenced 147 KB asset still ships to the edge. The argument
 * the banner carried is unchanged: it is the same H2 and the same standfirst,
 * set centred instead of beside a photo.
 *
 * THE BEAM IS CSS IN app/globals.css (`.beam-lens`, `.beam-wash`), not an
 * image and not an inline style. Read the long note over those two classes
 * before changing a colour, a stop, or this section's top padding — the
 * stops are set by the measured contrast ratio of the eyebrow against the
 * beam, so moving the text nearer the lens is the same change as turning
 * the beam up.
 *
 * THE DISCLOSURE IS A <details>, NOT A useState. It is server-rendered
 * openable markup: the full text is in the HTML for SEO whether or not the
 * bundle lands, the toggle works with JavaScript disabled, and the keyboard
 * and screen-reader behaviour come for free. A React accordion would have
 * been none of those three. No `open` attribute, so it is collapsed on
 * arrival every time.
 *
 * EVERY CLAIM HERE IS ALREADY IN lib/iriz.js OR IN `POINTS` BELOW — HERO,
 * HIGHLIGHTS, SPECS, FULL_SPEC_SHEET, FAQS, SETUP_STEPS and TROUBLESHOOTING.
 * Nothing was invented for this section, and nothing may be: it is the
 * longest piece of copy on the site and therefore the easiest place for an
 * unsourced spec to hide. Each card below names the row it came from.
 *
 * AUTO FOCUS IS NOT CLAIMED HERE, AND THAT IS A DECISION, NOT AN OMISSION.
 * Card 5 is the keystone alone. dc45c7a removed auto-focus from this site
 * everywhere — copy, specs, compare table, FAQ, meta, JSON-LD and alt text
 * — because the carton prints "4pt Auto Keystone" and names no focus
 * behaviour. FULL_SPEC_SHEET has no focus row, HIGHLIGHTS says "4-point
 * Auto Keystone", COMPARISON's row is "Keystone Correction". Two mentions
 * survive that cleanup by accident (components/TechSpecs alt text, and
 * SETUP_STEPS in lib/iriz.js) and they are leftovers, not licence. Do not
 * put focus back without the box in your hand.
 */

/**
 * The six cards. `stat` + `unit` is one figure split across two lines, so
 * the pair is read aloud as one thing or not at all — see the aria note at
 * the render site.
 *
 * `source` is not rendered. It is the FULL_SPEC_SHEET group and row each
 * figure was taken from, written down so the next person can check a number
 * without searching for it. All six were re-checked against the sheet when
 * this layout was built; none changed.
 */
const CARDS = [
  {
    stat: '500',
    unit: 'ANSI lumens',
    title: 'Brightness you can see',
    body: 'Measured on the wall, not at the bulb.',
    source: 'Optics & Display > Brightness: "True 500 ANSI Lumens"',
  },
  {
    stat: '1080p',
    unit: 'Native',
    title: 'A real Full HD panel',
    body: '1920 × 1080 — sharp and readable.',
    source: 'Optics & Display > Native Resolution: "1080P (1920×1080)"',
  },
  {
    // Read from THROW_RANGE, not typed: the note over it in lib/iriz.js lists
    // five places the screen-size range is written out and warns they must
    // agree. This is a sixth consumer, not a sixth copy.
    stat: `${THROW_RANGE.max.size}″`,
    unit: '1:1 throw',
    title: `${THROW_RANGE.min.size} to ${THROW_RANGE.max.size} inches`,
    body: 'Step back for a bigger picture.',
    source: 'Throw & Screen > Screen Size Range + Throw Ratio',
  },
  {
    stat: '180°',
    unit: 'Stand',
    title: 'Wall or ceiling',
    body: 'Watch on the ceiling from bed.',
    source: 'Throw & Screen > Angle Adjustment: "Stepless, 0°–180°"',
  },
  {
    // KEYSTONE ONLY — see the auto-focus note in the file header.
    stat: '4-pt',
    unit: 'Auto keystone',
    title: 'Squares itself',
    body: 'Straight picture at any angle.',
    source: 'Optics & Display > Keystone Correction: "4-point automatic"',
  },
  {
    stat: '14',
    unit: 'Android',
    title: 'Apps built in',
    body: 'No streaming stick needed.',
    source: 'Platform > Operating System: "Android 14"',
  },
];

const POINTS = [
  {
    heading: 'A projector sized for the room you actually have',
    body: [
      `The ${BRAND.model} is a mini projector built for a home rather than a lecture hall: a single compact unit that sits on a side table, a shelf, or the floor at the end of a bed, and throws a picture across the room with nothing mounted to anything.`,
      'That is the whole premise. A home cinema that has to be installed is a project, and projects get postponed. This one is something you put down, plug in, and point at a wall.',
    ],
  },
  {
    heading: 'True 500 ANSI lumens, measured the honest way',
    body: [
      'Brightness is where projector specifications go wrong, and it is worth knowing why. ANSI lumens is the industry’s standardised measurement, averaged across nine points of the projected image — what you actually see on the wall. "LED lumens" is measured at the bulb, before the light has passed through any optics, which is how a projector with a fraction of the real output can print a far bigger number on its box.',
      `The ${BRAND.model} is rated at a true 500 ANSI lumens. That holds up in a normally lit room, and it is the number we will keep quoting, because it is the one that describes the picture rather than the lamp.`,
    ],
  },
  {
    heading: 'Native 1080p — and what "native" is doing in that sentence',
    body: [
      'The panel is a 3.5-inch LTPS LCD with a native resolution of 1920 × 1080. Every pixel of a 1080p source has a physical pixel of its own to land on, which is what keeps text legible and faces sharp at the sizes a projector works at.',
      'The chipset will decode video up to 8K, and that is a decoding capability, not a display one — an 8K file plays, scaled down to the panel. We draw the distinction here because plenty of listings do not, and a resolution figure borrowed from the decoder is the other number on a projector box worth reading twice.',
    ],
  },
  {
    heading: 'Screen size is just a question of where you put it',
    body: [
      // THROW_RANGE.line leads, and the sentence before it is NOT a
      // restatement of it: that line already says "a 1:1 throw ratio", so an
      // opening sentence explaining the ratio put the same fact on the page
      // twice in forty words.
      `${THROW_RANGE.line} At ${THROW_RANGE.min.distance} m that is roughly ${THROW_RANGE.min.size} inches of picture; at ${THROW_RANGE.max.distance} m, up to ${THROW_RANGE.max.size} inches.`,
      'In practice that makes the room the control. Pull the unit back along a coffee table for a bigger picture, push it forward for a brighter, tighter one — no lens swap, no settings, no calculator.',
    ],
  },
  {
    heading: 'Bedrooms, ceilings and awkward angles',
    body: [
      'The stand adjusts steplessly through 0° to 180°, so the picture can go on the wall opposite, or straight up onto the ceiling from a bedside table. Projecting at an angle normally means a trapezoid instead of a rectangle, and that is the problem automatic keystone correction exists to solve: the unit squares the image up in hardware.',
      'It runs on movement. Move the projector and it re-squares itself once it settles, which is what makes it reasonable to carry it from one room to another rather than leaving it where it was first set up.',
    ],
  },
  {
    heading: 'Set up in about five minutes',
    body: [
      `Put it on something flat between ${THROW_RANGE.min.distance} and ${THROW_RANGE.max.distance} m from the wall, angle it, and plug it in. Android 14 walks you through joining Wi-Fi and signing in, the auto keystone squares the picture while you do, and that is setup finished.`,
      'If a tricky room defeats the automatic correction, the F+ and F− keys on the remote trim the focus and the keystone can be nudged in Settings.',
    ],
  },
  {
    heading: 'Everything you watch, already on it',
    body: [
      'Android 14 is built in, with a remote in the box — so the apps you watch install onto the projector itself over Wi-Fi. There is no stick to buy, no second remote, no HDMI input occupied before you start.',
      'The inputs are there when you want them: HDMI for a console or a laptop, USB-A for playing files off a drive, and a 3.5 mm output for headphones or a speaker. HDMI and USB playback work with no network at all — only the streaming side of it needs Wi-Fi.',
    ],
  },
];

export default function WhyIriz() {
  return (
    /*
     * `relative isolate overflow-hidden`, and all three are doing work:
     *
     *   relative   the two beam layers are positioned against this box, so
     *              the gradient origin lands on the section's own top edge
     *              rather than on whatever ancestor happened to be
     *              positioned.
     *   isolate    a fresh stacking context, so `z-0`/`z-10` below are
     *              local to this section and cannot interleave with the
     *              sticky buy bar or the header.
     *   overflow-  the beam is 1100px wide and centred, so on any viewport
     *   hidden     narrower than that it extends past both edges. Without
     *              the clip the DOCUMENT grows and the whole site gains a
     *              horizontal scrollbar — the one responsive defect that a
     *              screenshot at the same width cannot show you. It is also
     *              why `.beam-lens` is offset 5px down; see that class.
     */
    <section
      id="why-iriz"
      className="relative isolate scroll-mt-20 overflow-hidden border-b border-border-subtle bg-black-soft pb-20 pt-24 min-[700px]:pt-28"
    >
      {/* ==================================================================
          A) THE BEAM. Two decorative layers, behind everything (`z-0`
          against the header's `z-10`), `aria-hidden` and non-interactive:
          a screen reader is told nothing, and a pointer passes straight
          through to the text. Geometry and colour live in globals.css.
          ================================================================== */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <span className="beam-wash" />
        <span className="beam-lens" />
      </div>

      {/*
        NOT `.section-container`. That helper is `px-6` (24px) on a phone and
        the brief specifies 16px of side padding for this section, which is
        what `px-4` is. Everything from 700px up matches the helper exactly
        (`px-10`, then `px-16` at lg) and the max width is the same
        `max-w-container-xl`, so this section aligns with every other one on
        the site at every width a desktop or tablet sees. The 8px difference
        exists on phones only, and it is deliberate: these cards are a single
        column there and the extra width is the point.
      */}
      <div className="relative z-10 mx-auto w-full max-w-container-xl px-4 min-[700px]:px-10 lg:px-16">
        {/* ================================================================
            B) THE CENTRED HEADER, standing in the beam.

            `max-w-[820px]` is the brief's measure and it is also the reason
            the beam reads as a beam: the text column is narrower than the
            1100px wash, so the light is visible either side of it rather
            than only behind it.
            ================================================================ */}
        <Reveal className="mx-auto max-w-[820px] text-center">
          {/* `uppercase` rather than a typed "WHY IRIZ": the model name stays
              sourced from BRAND, and the capitals are presentation. A screen
              reader reads the DOM text, "Why IRIZ", not six shouted
              letters. */}
          <p
            className="text-xs font-bold uppercase tracking-[0.24em]"
            style={{ color: '#5b9dff' }}
          >
            Why {BRAND.model}
          </p>

          {/* The section's only H2. The six cards below are H3s under it, as
              are the long-form headings inside the <details>. The page's
              single H1 is the hero's.

              clamp(36px, 4.5vw, 60px): the brief's 36px on a phone and 60px
              on a desktop, with the vw term carrying the middle. 4.5vw hits
              36px at 800px and 60px at 1333px, so a 390px phone and a 1440px
              desktop both land exactly on the specified figure. */}
          <h2
            className="mt-5 font-bold text-white"
            style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
              letterSpacing: '-0.035em',
              lineHeight: 1.06,
            }}
          >
            Why {BRAND.model} is the 1080p home projector to buy
          </h2>

          <p
            className="mx-auto mt-6 max-w-[680px] text-[18px] leading-relaxed"
            style={{ color: '#9aa0a9' }}
          >
            {BRAND.fullName} is a native 1080p Android smart projector made for Indian
            homes — 500 ANSI lumens, up to {THROW_RANGE.max.size} inches, apps built in.
          </p>
        </Reveal>

        {/* ================================================================
            C) THE SIX CARDS.

            A <ul>, because these are six peers with no order to them —
            unlike the header's argument, they are interchangeable.

            ONE COLUMN, THEN TWO, THEN THREE. The brief allows two columns on
            a tablet "if 3 looks cramped", and it is: at 700px a three-up row
            leaves (688 − 40 gap) / 3 = 216px per card, and 30px of padding
            each side takes the text column to 156px — narrow enough that
            "Brightness you can see" breaks over three lines and
            "AUTO KEYSTONE" at 0.2em tracking runs to the edge. Two columns
            give 300px, and three arrive at 1024px where they give 301px.

            `items-stretch` is the grid default, and `h-full` on BOTH the
            Reveal wrapper and the <article> inside it is what makes it bite:
            a grid item stretches to its row, but nothing inside it inherits
            that height unless told to — which is the usual reason a row of
            cards comes out ragged.
            ================================================================ */}
        <ul className="mt-14 grid grid-cols-1 items-stretch gap-3 min-[700px]:grid-cols-2 min-[700px]:gap-5 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal
              key={card.title}
              as="li"
              y={20}
              // Capped: a stagger that keeps growing down a six-card grid
              // leaves the last one arriving half a second late.
              delay={Math.min(i, 3) * 0.05}
              className="h-full"
            >
              <article
                className="flex h-full flex-col rounded-[22px] p-[30px]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/*
                  THE FIGURE AND ITS UNIT ARE ONE THING, AND BOTH ARE
                  `aria-hidden`.

                  "500" over "ANSI LUMENS" is the H3's own number set large.
                  Left audible, a screen reader announces "500. ANSI lumens.
                  Brightness you can see. Measured on the wall, not at the
                  bulb." — the figure twice, once without its noun. Hidden,
                  the card reads as its heading and its sentence, and the
                  numbers are still in the server HTML for a crawler.

                  `whitespace-nowrap` on the figure so "1080p" never breaks
                  in two, which is the one string here long enough to try.
                */}
                <p aria-hidden="true" className="beam-stat whitespace-nowrap">
                  {card.stat}
                </p>
                <p
                  aria-hidden="true"
                  className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: '#8fb8ff' }}
                >
                  {card.unit}
                </p>

                <h3 className="mt-6 text-[18px] font-semibold tracking-tight text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: '#8d939c' }}>
                  {card.body}
                </p>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* THE FULL READ. A native <details>: the prose is in the server
            HTML for a crawler, the toggle works with no JavaScript, and the
            keyboard and screen-reader behaviour come for free.

            IT SURVIVED THE REDESIGN ON PURPOSE, TWICE NOW. Option F replaced
            the banner and the cards and left this alone; design L replaces
            Option F and leaves it alone again. It is ~800 words of indexed
            copy and the only long-form text on the homepage. Dropping it to
            change a layout would be an SEO regression smuggled in behind a
            visual change.

            Its seven headings are H3s, the same level as the six cards', and
            that is correct rather than tidy: they are siblings under this
            section's one H2, not children of a card.

            `group-open:rotate-45` turns the plus into a cross, and
            `motion-reduce:transition-none` drops the tween rather than the
            state — reduced motion still gets the affordance, without the
            movement. `[&::-webkit-details-marker]:hidden` plus `list-none`
            removes the native triangle in both engines. */}
        <Reveal y={20} delay={0.2} className="mt-5">
          <details className="group glass-panel overflow-hidden">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-soft sm:px-8 [&::-webkit-details-marker]:hidden">
              Read the full story
              <span
                aria-hidden="true"
                className="shrink-0 text-xl text-white/40 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>

            {/* The 680px measure the policy pages use for continuous text —
                65-75 characters at this size. */}
            <div className="flex max-w-[680px] flex-col gap-10 px-6 pb-8 sm:px-8">
              {POINTS.map((point) => (
                <div key={point.heading}>
                  <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {point.heading}
                  </h3>
                  {point.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="mt-3 text-sm leading-relaxed text-white/60 sm:text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </Reveal>
      </div>
    </section>
  );
}
