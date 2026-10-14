import Reveal from './Reveal';
import { BRAND, THROW_RANGE } from '@/lib/iriz';

/**
 * "Why IRIZ" — the long-form read, and the only section on the homepage that
 * is prose rather than pictures.
 *
 * WHY IT EXISTS. Everything above it states the product in fragments: a
 * hero claim, six highlight tiles, a dial, a spec table, a comparison grid.
 * That is the right shape for someone scanning, and it is the wrong shape
 * for the two readers who decide late — the person weighing this against a
 * cheaper projector with a bigger number on the box, and a search engine
 * with no picture to read. Both need the connective tissue: not "500 ANSI
 * lumens" but what an ANSI lumen is and why the other number is bigger.
 *
 * WHERE IT SITS. After the comparison table and before the closing section
 * (the buy card or the launch-list signup). It is the closing argument —
 * last thing before the ask — and putting it any higher would make a reader
 * scroll through 800 words to reach the product photography.
 *
 * HOW IT IS BUILT TO BE SKIMMED, which is the whole design problem with
 * 800 words on a page like this:
 *
 *   - A sticky left rail at lg carries the heading and the lede, so the
 *     section's subject stays on screen while the prose scrolls past it. The
 *     rail collapses to the top on narrow screens, where sticky positioning
 *     in a short viewport would eat the reading area.
 *   - Each point is an h3 and two short paragraphs, never more. A reader who
 *     only reads the seven headings still gets the argument in order.
 *   - The prose column is capped at 680px, the same measure the policy pages
 *     use for continuous text.
 *   - Numbers come from THROW_RANGE in lib/iriz.js rather than being typed
 *     into the sentence, so the dial above and the prose here cannot ever
 *     quote different distances.
 *
 * EVERY CLAIM HERE IS ALREADY IN lib/iriz.js — HERO, HIGHLIGHTS, SPECS,
 * FULL_SPEC_SHEET, FAQS, SETUP_STEPS and TROUBLESHOOTING. Nothing was
 * invented for this section, and nothing may be: it is the longest piece of
 * copy on the site and therefore the easiest place for an unsourced spec to
 * hide. If a fact is not in that file, it does not belong in this one.
 */

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
      'Auto focus runs on the same trigger. Move the projector and it refocuses and re-squares itself once it settles, which is what makes it reasonable to carry it from one room to another rather than leaving it where it was first set up.',
    ],
  },
  {
    heading: 'Set up in about five minutes',
    body: [
      `Put it on something flat between ${THROW_RANGE.min.distance} and ${THROW_RANGE.max.distance} m from the wall, angle it, and plug it in. Google TV walks you through joining Wi-Fi and signing in, the auto focus and keystone settle the picture while you do, and that is setup finished.`,
      'If a tricky room defeats the automatic correction, the F+ and F− keys on the remote trim the focus and the keystone can be nudged in Settings. Those are a trim on top of auto focus, not a manual mode you have to switch into.',
    ],
  },
  {
    heading: 'Everything you watch, already on it',
    body: [
      'Google TV is built in, on Android 14, with "Hey Google" voice search and a remote in the box — so Netflix, YouTube, Disney+, Prime Video and the rest of the 10,000+ official apps are on the device itself. There is no stick to buy, no second remote, no HDMI input occupied before you start.',
      'The inputs are there when you want them: HDMI for a console or a laptop, USB-A for playing files off a drive, and a 3.5 mm output for headphones or a speaker. A low-latency mode brings response time down to 0.004 s for gaming over HDMI, and HDMI and USB playback work with no network at all — only the Google TV side of it needs Wi-Fi.',
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
        {/* Column widths are chosen to USE the container rather than to look
            tidy in isolation. A 22rem rail beside a 640px measure left about
            250px of empty black against the right edge at 1440 — which reads
            as a layout that failed to fill, not as whitespace. A wider rail
            (26rem), a wider gap and the site's own 680px prose measure close
            that to an ordinary margin, and all three still collapse to one
            column below lg. */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-24">
          {/* THE RAIL. `self-start` is what makes `sticky` work inside a grid
              — a stretched grid item is already as tall as the row, so it has
              no room to stick within. Sticky only above lg: in a phone
              viewport this block is most of the screen, and pinning it would
              leave a sliver to read the prose through. */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
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

          {/* THE PROSE. `max-w-[680px]` is the measure the policy pages use
              for continuous text — 65-75 characters at this size — and
              `gap-10` between points so each heading has air above it and
              reads as an entry point rather than a paragraph break. */}
          <div className="flex max-w-[680px] flex-col gap-10">
            {POINTS.map((point, i) => (
              <Reveal
                key={point.heading}
                // Capped: a stagger that keeps growing down a seven-item list
                // leaves the last one arriving half a second late.
                delay={Math.min(i, 3) * 0.05}
                y={20}
              >
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
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
