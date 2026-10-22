import { Sun, MonitorPlay, Maximize2, RotateCw, Smartphone, Timer } from 'lucide-react';
import Reveal from './Reveal';
import { BRAND, THROW_RANGE } from '@/lib/iriz';

/**
 * "Why IRIZ" — the closing argument, as six cards over the long-form read.
 *
 * WHY IT EXISTS. Everything above it states the product in fragments: a
 * hero claim, six highlight tiles, a dial, a spec table, a comparison grid.
 * That is the right shape for someone scanning, and it is the wrong shape
 * for the two readers who decide late — the person weighing this against a
 * cheaper projector with a bigger number on the box, and a search engine
 * with no picture to read. Both need the connective tissue: not "500 ANSI
 * lumens" but what an ANSI lumen is and why the other number is bigger.
 *
 * WHY IT IS CARDS NOW. It used to be the prose alone — seven headings and
 * fourteen paragraphs in a two-column read. The argument was good and
 * almost nobody reached it, because it arrived as eight hundred words at
 * the bottom of a page the reader had already been scrolling for a while.
 * The cards are that same argument at a glance: one claim each, the number
 * that backs it, and two lines of why. The prose is still here in full, one
 * tap away, for the reader who wants it and the crawler that reads
 * everything.
 *
 * THE DISCLOSURE IS A <details>, NOT A useState. It is server-rendered
 * openable markup: the full text is in the HTML for SEO whether or not the
 * bundle lands, the toggle works with JavaScript disabled, and the keyboard
 * and screen-reader behaviour come for free. A React accordion would have
 * been none of those three. No `open` attribute, so it is collapsed on
 * arrival every time and the section still reads as cards.
 *
 * EVERY CLAIM HERE IS ALREADY IN lib/iriz.js OR IN `POINTS` BELOW — HERO,
 * HIGHLIGHTS, SPECS, FULL_SPEC_SHEET, FAQS, SETUP_STEPS and TROUBLESHOOTING.
 * Nothing was invented for this section, and nothing may be: it is the
 * longest piece of copy on the site and therefore the easiest place for an
 * unsourced spec to hide. Each card's `from` key names the POINT it
 * summarises, so a card and its paragraph cannot drift apart unnoticed.
 */

/**
 * The six cards. Every number is read from lib/iriz.js or lifted from the
 * `POINTS` entry named in `from` — none is typed fresh here.
 *
 * Six, from seven points: "A projector sized for the room you actually
 * have" has no number of its own. It is the premise the section lede
 * already states, so it stays in the prose rather than becoming a card with
 * an empty stat line.
 */
const CARDS = [
  {
    from: 'True 500 ANSI lumens, measured the honest way',
    icon: Sun,
    stat: '500',
    unit: 'true ANSI lumens',
    heading: 'Brightness measured on the wall',
    body:
      'ANSI averages nine points of the projected image. "LED lumens" is measured at the bulb, '
      + 'which is how a dimmer projector prints a bigger number on its box.',
  },
  {
    from: 'Native 1080p — and what "native" is doing in that sentence',
    icon: MonitorPlay,
    stat: '1080p',
    unit: 'native 1920 × 1080',
    heading: 'A real pixel for every pixel',
    body:
      'A 3.5-inch LTPS LCD panel, so every pixel of a 1080p source has a physical pixel of its '
      + 'own to land on. That is what keeps text legible at projector sizes.',
  },
  {
    from: 'Screen size is just a question of where you put it',
    icon: Maximize2,
    stat: `${THROW_RANGE.min.size}–${THROW_RANGE.max.size}"`,
    unit: `at ${THROW_RANGE.min.distance}–${THROW_RANGE.max.distance} m`,
    heading: 'The room is the dial',
    body:
      'A 1:1 throw ratio. Pull the unit back along the table for a bigger picture, push it '
      + 'forward for a brighter, tighter one — no lens swap, no calculator.',
  },
  {
    from: 'Bedrooms, ceilings and awkward angles',
    icon: RotateCw,
    stat: '0–180°',
    unit: 'stepless stand',
    heading: 'Wall, or straight up at the ceiling',
    body:
      'Automatic keystone correction squares the image in hardware, and re-squares it once the '
      + 'projector settles after you move it to another room.',
  },
  {
    from: 'Everything you watch, already on it',
    icon: Smartphone,
    stat: 'Android 14',
    unit: 'remote in the box',
    heading: 'The apps are already on it',
    body:
      'They install onto the projector itself over Wi-Fi. No stick to buy, no second remote, and '
      + 'no HDMI input occupied before you start.',
  },
  {
    from: 'Set up in about five minutes',
    icon: Timer,
    stat: '~5 min',
    unit: 'box to picture',
    heading: 'Put it down, plug it in',
    body:
      'Android 14 walks you through joining Wi-Fi while the auto keystone squares the picture. '
      + 'That is setup finished.',
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
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-3">Why {BRAND.model}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            The case for it, in plain terms.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/55 sm:text-base">
            Projector specifications are unusually easy to inflate, and the two numbers that
            matter most — brightness and resolution — are the two most often quoted from the
            wrong measurement. Here is what the {BRAND.fullName} is, how it behaves in a real
            room, and which numbers to check on anything you compare it against.
          </p>
        </Reveal>

        {/* THE CARDS. One column, two at sm, three at lg.
            `items-stretch` is the grid default, and `h-full` on BOTH the
            Reveal wrapper and the card inside it is what makes that bite: a
            grid item stretches to its row, but nothing inside it inherits
            that height unless told to, which is the usual reason a row of
            cards comes out ragged. The card is then a flex column, so its
            own content can distribute inside the matched height. */}
        <ul className="mt-12 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <Reveal
                key={card.heading}
                as="li"
                y={20}
                // Capped: a stagger that keeps growing down a six-card grid
                // leaves the last one arriving half a second late.
                delay={Math.min(i, 3) * 0.05}
                className="h-full"
              >
                <article className="bento-tile flex h-full flex-col p-6 sm:p-7">
                  <span
                    className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft"
                    aria-hidden="true"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>

                  {/* `whitespace-nowrap` on the stat, `flex-wrap` on the row.
                      Together they mean a long stat keeps its own line and
                      pushes the UNIT down instead of breaking itself in half:
                      "Android 14" was wrapping to "Android" over "14", which
                      doubled that one card's stat block and made its whole
                      row taller than the one above. */}
                  <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="stat-number stat-number-sm whitespace-nowrap">{card.stat}</span>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/55">
                      {card.unit}
                    </span>
                  </p>

                  <h3 className="mt-4 text-base font-semibold tracking-tight text-white">
                    {card.heading}
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

            `group-open:rotate-45` turns the plus into a cross, and
            `motion-reduce:transition-none` drops the tween rather than the
            state — reduced motion still gets the affordance, without the
            movement. `[&::-webkit-details-marker]:hidden` plus
            `list-none` removes the native triangle in both engines. */}
        <Reveal y={20} delay={0.2} className="mt-10">
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
