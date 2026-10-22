import Image from 'next/image';
import { Sun, MonitorPlay, Maximize2, RotateCw, Frame, Cpu } from 'lucide-react';
import Reveal from './Reveal';
import { BRAND, THROW_RANGE } from '@/lib/iriz';

/**
 * "Why IRIZ" — a light banner carrying the product, over six dark cards.
 *
 * WHY IT EXISTS. Everything above it states the product in fragments: a
 * hero claim, six highlight tiles, a dial, a spec table, a comparison grid.
 * That is the right shape for someone scanning, and it is the wrong shape
 * for the two readers who decide late — the person weighing this against a
 * cheaper projector with a bigger number on the box, and a search engine
 * with no picture to read. Both need the connective tissue: not "500 ANSI
 * lumens" but what an ANSI lumen is and why the other number is bigger.
 *
 * THE BANNER IS THE ONE LIGHT SURFACE ON A DARK PAGE, deliberately. It is
 * the only place the product is photographed rather than rendered, and the
 * studio ground it was shot on is light — so the card is light and the
 * photograph dissolves into it instead of sitting on it as a grey slab.
 * See BANNER_SURFACE below for the one number that has to agree with the
 * asset for that to work.
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
 * unsourced spec to hide.
 *
 * AUTO FOCUS IS NOT CLAIMED HERE, AND THAT IS A DECISION, NOT AN OMISSION.
 * Card 05 is the keystone alone. dc45c7a removed auto-focus from this site
 * everywhere — copy, specs, compare table, FAQ, meta, JSON-LD and alt text
 * — because the carton prints "4pt Auto Keystone" and names no focus
 * behaviour. FULL_SPEC_SHEET has no focus row, HIGHLIGHTS says "4-point
 * Auto Keystone", COMPARISON's row is "Keystone Correction". Two mentions
 * survive that cleanup by accident (components/TechSpecs alt text, and
 * SETUP_STEPS in lib/iriz.js) and they are leftovers, not licence. Do not
 * put focus back without the box in your hand.
 */

/**
 * THE BANNER'S GROUND — AND MEASURE IT IN THE BROWSER, NOT IN THE FILE.
 *
 * The card has to match the photograph's studio ground. The photo is
 * anchored into the card's right side with its left edge feathered out by a
 * mask, and wherever that mask is still partly transparent the card shows
 * through the backdrop. If the two disagree, the blend becomes a visible
 * tonal ramp across the banner — which is the exact seam the mask exists to
 * remove.
 *
 * THE TRAP, AND IT COST A ROUND TRIP HERE. Sampling why-iriz-banner.jpg
 * with sharp returns #dadbde, flat, everywhere — nine patches around the
 * edges, a band across the top, a column down the side, all #dadbde. The
 * optimised AVIF next/image serves measures #dadbde too. The browser
 * nonetheless PAINTS that backdrop at roughly #f0eef3, about twenty levels
 * lighter, and the painted value is the only one that matters because it is
 * the one sitting next to the card.
 *
 * So this was briefly set to #dadbde on the strength of the file, and the
 * stacked layout grew a hard horizontal seam at the photo's top edge:
 * #dadbde meeting #f0eef3, a step of 21/255, plainly visible. #eeeff1 —
 * the value the brief asked for — takes that step down to 2/255, which is
 * not. Verified by scanning the rendered pixels either side of the edge at
 * 768px, and along the masked left edge at 1440px, where the largest step
 * between 10px samples is 9/255 of ordinary lighting falloff and there is
 * no edge at all.
 *
 * If the banner is ever re-shot, re-measure by screenshotting the rendered
 * card and reading the pixels across the photo's boundary. Do not sample
 * the source file and trust it.
 */
const BANNER_SURFACE = '#eeeff1';

/**
 * Ink for the light banner. All three are computed against BANNER_SURFACE
 * for WCAG AA (4.5:1 for body text), not eyeballed:
 *
 *   #0b0e14 on #eeeff1   16.79:1   the H2
 *   #3f4654 on #eeeff1    8.24:1   the paragraph
 *   #1d4ed8 on #eeeff1    5.82:1   the eyebrow
 *
 * The eyebrow is NOT the site's accent (#3B82F6). That blue is built for
 * white-on-dark and manages only 3.19:1 against this ground — it fails AA
 * at the 12px the eyebrow is set at, and it is not a close call. #1d4ed8 is
 * the same hue family, darker, and clears 4.5:1 comfortably. The dark cards
 * below keep the ordinary accent, where it is correct.
 */
const BANNER_INK = {
  heading: '#0b0e14',
  body: '#3f4654',
  eyebrow: '#1d4ed8',
};

/** The dark cards' own surface and hairline, from the brief. */
const CARD_SURFACE = '#121317';
const CARD_BORDER = '#22252b';

/**
 * The six cards. Every number is read from lib/iriz.js or restates a claim
 * the site already makes — none is typed fresh here.
 *
 * `stat` REPEATS the title by design: it is the title's own figure, set
 * large. That is why it is aria-hidden where it renders — a screen reader
 * reading both hears "500 ANSI lumens brightness. 500."
 */
const CARDS = [
  {
    icon: Sun,
    stat: '500',
    title: '500 ANSI lumens brightness',
    body: 'Measured on the wall, not at the bulb.',
  },
  {
    icon: MonitorPlay,
    stat: '1080p',
    title: 'Native 1080p Full HD',
    body: 'A true 1920 × 1080 panel. Text stays readable.',
  },
  {
    icon: Maximize2,
    // Read from THROW_RANGE, not typed: the note above it lists five places
    // the screen-size range is written out and warns they must agree. This
    // is a sixth consumer, not a sixth copy.
    stat: `${THROW_RANGE.max.size}″`,
    title: `${THROW_RANGE.min.size} to ${THROW_RANGE.max.size} inch screen`,
    body: '1:1 throw — step back for a bigger picture.',
  },
  {
    icon: RotateCw,
    stat: '180°',
    title: '180° stand, wall or ceiling',
    body: 'Watch on the ceiling from your bed.',
  },
  {
    icon: Frame,
    // KEYSTONE ONLY — see the auto-focus note in the file header. The stat
    // stays "Auto" because the keystone genuinely is automatic: that is the
    // spec sheet's own word ("4-point automatic, hardware-based").
    stat: 'Auto',
    title: '4-point auto keystone',
    body: 'Place it at an angle — it squares the picture itself.',
  },
  {
    icon: Cpu,
    stat: '14',
    title: 'Android 14 smart projector',
    body: 'Apps over Wi-Fi — no streaming stick.',
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
    <section
      id="why-iriz"
      className="scroll-mt-20 border-b border-border-subtle bg-black-soft py-20"
    >
      <div className="section-container">
        {/* ================================================================
            A) THE BANNER.

            `overflow-hidden` + `rounded-[32px]` is what makes the photo's
            overflow work: it is deliberately taller than the card and hangs
            past the top and right edges, and the card's own radius crops it.
            Without the clip it would simply stick out.

            THE SIDE-BY-SIDE LAYOUT STARTS AT 1180px, NOT 700px, AND THAT
            IS ARITHMETIC RATHER THAN TASTE. The brief's desktop figures —
            a 520px card, a 660px photo, 64px of padding and a 460px text
            column — need the photo's opaque region to begin after the text
            ends. The photo is 742px wide at that height and its mask runs
            out at 22%, so opaque starts 578px in from its left edge; the
            text ends 524px in from the card's. Those only clear each other
            once the card is about 1180px wide. Measured at 768px, where the
            card is 688px: the photo covered the ENTIRE card and the heading
            sat unreadably across the lens.

            So the card stacks — the brief's own mobile treatment, text above
            and photo bottom-right — everywhere below 1180, with the photo
            at 420px rather than 330px between 700 and 1179 so the wider card
            does not look half empty. No third layout was invented; the two
            in the brief are used, and the switch is where the geometry says
            it has to be.

            One element, two layouts, no duplicated markup — so the copy
            exists exactly once in the DOM and a crawler sees one H2.
            ================================================================ */}
        <Reveal>
          <div
            className="relative isolate overflow-hidden rounded-[32px] pb-[260px] min-[700px]:pb-[320px] min-[1180px]:h-[520px] min-[1180px]:pb-0"
            style={{ backgroundColor: BANNER_SURFACE }}
          >
            {/* `relative z-10` so the text stays above the photograph at the
                widths where the two begin to converge. */}
            <div className="relative z-10 max-w-[460px] px-[22px] pb-6 pt-[28px] min-[700px]:px-10 min-[700px]:pt-10 min-[1180px]:p-16">
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: BANNER_INK.eyebrow }}
              >
                Why {BRAND.model}
              </p>

              {/* The section's only H2. The six cards below are H3s under
                  it, as are the long-form headings. The page's single H1 is
                  the hero's. */}
              <h2
                className="mt-3 text-[28px] font-bold leading-[1.08] tracking-tighter min-[700px]:text-[40px]"
                style={{ color: BANNER_INK.heading }}
              >
                Why {BRAND.model} is the 1080p home projector to buy
              </h2>

              <p
                className="mt-4 text-sm leading-relaxed min-[700px]:text-base"
                style={{ color: BANNER_INK.body }}
              >
                A native 1080p Android smart projector made for Indian homes — 500 ANSI
                lumens, up to {THROW_RANGE.max.size} inches, apps built in.
              </p>
            </div>

            {/* THE PHOTOGRAPH.

                `w-auto max-w-none` with a fixed HEIGHT is the whole trick:
                the intrinsic 1600x1424 drives the width, so the product is
                never squashed, and `max-w-none` is REQUIRED because the
                global `img { max-width: 100% }` reset would otherwise shrink
                it back inside the card and kill the overflow.

                THE MASK feathers the LEFT edge only. The other three never
                need one: the photo is bottom-anchored and hangs past the top
                and the right, so those edges fall outside the card and the
                radius crops them. The left edge is the only one that lands
                in open card, and the gradient dissolves it.

                22% IS NOT ARBITRARY AND MUST NOT BE RAISED. The "bluneuron
                IRIZ" wordmark sits at 27%-44% of the file's width, so a mask
                reaching 27% would start eating the logo the brief requires
                to stay fully visible. 22% clears it by five points of image
                width — about 37px at the desktop size — and that margin is
                the reason for the number.

                NOT `priority`: this section is the bottom third of a long
                page and has never been in the first viewport. */}
            <Image
              src="/media/iriz/why-iriz-banner.jpg"
              alt={`${BRAND.fullName} 1080p smart projector`}
              width={1600}
              height={1424}
              loading="lazy"
              sizes="(min-width: 1180px) 742px, (min-width: 700px) 472px, 371px"
              className="pointer-events-none absolute bottom-0 right-0 h-[330px] w-auto max-w-none min-[700px]:h-[420px] min-[1180px]:-right-8 min-[1180px]:h-[660px]"
              style={{
                maskImage: 'linear-gradient(90deg, transparent 0%, #000 22%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 22%)',
              }}
            />
          </div>
        </Reveal>

        {/* ================================================================
            B) THE SIX CARDS. 3x2 from 700px, one column below.

            A <ul>, because these are six peers with no order to them —
            unlike the banner's argument, they are interchangeable. The grid
            is `items-stretch` by default, and `h-full` on BOTH the Reveal
            wrapper and the card inside it is what makes that bite: a grid
            item stretches to its row, but nothing inside it inherits that
            height unless told to, which is the usual reason a row of cards
            comes out ragged.
            ================================================================ */}
        <ul className="mt-[18px] grid grid-cols-1 items-stretch gap-[18px] min-[700px]:grid-cols-3">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
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
                  className="flex h-full flex-col rounded-[22px] border p-7"
                  style={{ backgroundColor: CARD_SURFACE, borderColor: CARD_BORDER }}
                >
                  {/* TOP ROW: icon left, stat right. `justify-between` pins
                      the stat to the right edge whatever its width. */}
                  <div className="flex items-center justify-between gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft"
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>

                    {/* `whitespace-nowrap` so "1080p" never breaks in two,
                        and `shrink-0` so the flex row gives it its width
                        rather than squeezing it. aria-hidden: it repeats the
                        H3 directly below. */}
                    <p
                      aria-hidden="true"
                      className="stat-number shrink-0 whitespace-nowrap text-[clamp(1.75rem,3vw,2.25rem)] leading-none"
                    >
                      {card.stat}
                    </p>
                  </div>

                  <h3 className="mt-6 text-base font-semibold tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{card.body}</p>
                </article>
              </Reveal>
            );
          })}
        </ul>

        {/* THE FULL READ. A native <details>: the prose is in the server
            HTML for a crawler, the toggle works with no JavaScript, and the
            keyboard and screen-reader behaviour come for free.

            IT SURVIVED THE REDESIGN ON PURPOSE. The brief replaced the
            banner and the cards, and this is neither — it is ~800 words of
            indexed copy and the only long-form text on the homepage.
            Dropping it to change a layout would be an SEO regression
            smuggled in behind a visual change.

            `group-open:rotate-45` turns the plus into a cross, and
            `motion-reduce:transition-none` drops the tween rather than the
            state — reduced motion still gets the affordance, without the
            movement. `[&::-webkit-details-marker]:hidden` plus `list-none`
            removes the native triangle in both engines. */}
        <Reveal y={20} delay={0.2} className="mt-[18px]">
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
