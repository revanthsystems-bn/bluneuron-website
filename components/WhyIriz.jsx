import Image from 'next/image';
import Reveal from './Reveal';
import { BRAND, THROW_RANGE } from '@/lib/iriz';

/**
 * "Why IRIZ" — the closing argument, as a photograph beside six numbered
 * reasons, over the long-form read.
 *
 * WHY IT EXISTS. Everything above it states the product in fragments: a
 * hero claim, six highlight tiles, a dial, a spec table, a comparison grid.
 * That is the right shape for someone scanning, and it is the wrong shape
 * for the two readers who decide late — the person weighing this against a
 * cheaper projector with a bigger number on the box, and a search engine
 * with no picture to read. Both need the connective tissue: not "500 ANSI
 * lumens" but what an ANSI lumen is and why the other number is bigger.
 *
 * WHY IT IS A TWO-COLUMN LIST NOW, not the six-card grid it was. The grid
 * gave every reason the same weight and the same box, which is the shape of
 * a spec table — and this page already has a spec table, two sections up.
 * A numbered list reads as an ARGUMENT in order, and pairing it with the
 * product itself is what the grid could not do: the cards had icons where
 * the photograph should have been.
 *
 * THE DISCLOSURE IS A <details>, NOT A useState. It is server-rendered
 * openable markup: the full text is in the HTML for SEO whether or not the
 * bundle lands, the toggle works with JavaScript disabled, and the keyboard
 * and screen-reader behaviour come for free. A React accordion would have
 * been none of those three. No `open` attribute, so it is collapsed on
 * arrival every time and the section still reads as the list.
 *
 * EVERY CLAIM HERE IS ALREADY IN lib/iriz.js OR IN `POINTS` BELOW — HERO,
 * HIGHLIGHTS, SPECS, FULL_SPEC_SHEET, FAQS, SETUP_STEPS and TROUBLESHOOTING.
 * Nothing was invented for this section, and nothing may be: it is the
 * longest piece of copy on the site and therefore the easiest place for an
 * unsourced spec to hide. Each reason's `from` key names the POINT it
 * summarises, so a reason and its paragraph cannot drift apart unnoticed.
 *
 * ONE CLAIM WAS REFUSED HERE, AND IT MATTERS. An earlier draft of this
 * section led reason 05 with "auto focus and 4-point keystone". Auto focus
 * is NOT a claim this site makes: dc45c7a removed it everywhere — copy,
 * specs, compare table, FAQ, meta, JSON-LD and alt text — because the
 * carton prints "4pt Auto Keystone" and names no focus behaviour at all.
 * FULL_SPEC_SHEET has no focus row, HIGHLIGHTS says "4-point Auto Keystone",
 * and COMPARISON's row is "Keystone Correction". So 05 is the keystone
 * alone. Do not put focus back without the box in your hand.
 */

/**
 * The six reasons, in order. Every number is read from lib/iriz.js or
 * lifted from the `POINTS` entry named in `from` — none is typed fresh.
 *
 * `stat` is the figure, `title` the claim, `body` the one line of why.
 * The stat REPEATS the title by design — it is the title's own number set
 * large — which is why it is aria-hidden below: a screen reader that read
 * both would hear "500 ANSI lumens brightness. Five hundred."
 */
const REASONS = [
  {
    from: 'True 500 ANSI lumens, measured the honest way',
    stat: '500',
    title: '500 ANSI lumens brightness',
    body:
      'Measured on the projected image, not at the bulb — so the number is what you see on '
      + 'your wall.',
  },
  {
    from: 'Native 1080p — and what "native" is doing in that sentence',
    stat: '1080p',
    title: 'Native 1080p Full HD',
    body: 'A true 1920 × 1080 panel. Movies look sharp and text stays readable.',
  },
  {
    from: 'Screen size is just a question of where you put it',
    // Read from THROW_RANGE, not typed: the screen-size range is written out
    // in five places and the note above THROW_RANGE lists them. This is a
    // sixth consumer and it must not become a sixth thing to keep in sync.
    stat: `${THROW_RANGE.max.size}″`,
    title: `${THROW_RANGE.min.size} to ${THROW_RANGE.max.size} inch screen size`,
    body: '1:1 throw ratio — step back from the wall for a bigger picture.',
  },
  {
    from: 'Bedrooms, ceilings and awkward angles',
    stat: '180°',
    title: '180° stand for wall or ceiling',
    body: 'Tilt it steplessly and watch on the ceiling from your bed.',
  },
  {
    from: 'Bedrooms, ceilings and awkward angles',
    // "Auto", because the keystone IS automatic — that is the box's own
    // claim and the spec sheet's ("4-point automatic, hardware-based").
    // The title says keystone and NOT focus; see the file note above.
    stat: 'Auto',
    title: '4-point automatic keystone',
    body: 'Place it at an angle and it squares the picture up itself, in hardware.',
  },
  {
    from: 'Everything you watch, already on it',
    stat: '14',
    title: 'Android 14 smart projector',
    body: 'Your apps are built in over Wi-Fi — no streaming stick needed.',
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
        {/* THE TWO COLUMNS.
            `lg:` is Tailwind's 1024px, which is NOT the 700px breakpoint this
            section is specified at — so the split is an arbitrary
            `min-[700px]:` variant instead. Below 700 it is one column and the
            photograph sits between the lede and the list, which is the order
            the markup is already in: no `order-*` juggling, and the reading
            order a screen reader gets is the reading order on screen.

            `items-start` so the left column does not stretch to the height of
            a six-row list and leave the photo floating in the middle of it.
            `minmax(0,…)` on both tracks is what stops a long stat forcing the
            grid wider than its container. */}
        <div className="grid items-start gap-12 min-[700px]:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-[700px]:gap-10 lg:gap-16">
          {/* LEFT — the argument's premise, and the product itself.
              NOT sticky. A sticky left column pins while the six reasons
              scroll past, which reads well at 1440 and badly at 700-900,
              where the column is nearly viewport-tall and pins against its
              own bottom edge. Static is what the brief asked for and the
              one that behaves the same at every width. */}
          <Reveal>
            <p className="eyebrow mb-3">Why {BRAND.model}</p>

            {/* The only H2 in this section. The six reasons below are H3s
                under it, and the long-form read's headings are H3s too, so
                the section is one H2 with a flat list of H3s beneath it. The
                page's single H1 is the hero's. */}
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Why {BRAND.model} is the 1080p home projector to buy
            </h2>

            <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-white/55 sm:text-base">
              {BRAND.fullName} is a native 1080p Android smart projector made for Indian homes
              — 500 ANSI lumens, a picture up to {THROW_RANGE.max.size} inches, and apps built
              in. Here&rsquo;s what sets it apart.
            </p>

            {/* THE PHOTOGRAPH.
                `aspect-[3/2]` on the FRAME and width/height on the image, so
                the box is reserved before the bytes land and nothing shifts.
                The source is 1800x1200 — exactly 3:2 — so `object-cover`
                crops NOTHING and the "bluneuron IRIZ" wordmark on the chassis
                survives at every width by construction, not by luck.
                `object-[50%_30%]` is therefore a no-op today and is set
                anyway: it is the right anchor if the asset is ever re-shot at
                a different ratio, and it keeps the crop off the lower third,
                which is where the wordmark is not.

                `rounded-[28px]`, not a token: the site's radii are 16/24 (2xl,
                3xl) and this sits between them by request.

                NOT `priority` — this section is the bottom third of a long
                page and has never been in the first viewport. It lazy loads,
                which is next/image's default. */}
            <figure className="relative mt-8 overflow-hidden rounded-[28px] border border-border-subtle bg-black">
              <Image
                src="/media/iriz/why-iriz.jpg"
                alt="BluNeuron IRIZ 1080p smart projector, front view"
                width={1800}
                height={1200}
                loading="lazy"
                sizes="(min-width: 1024px) 560px, (min-width: 700px) 46vw, 92vw"
                className="aspect-[3/2] w-full object-cover object-[50%_30%]"
              />

              {/* The chip is a REAL TEXT NODE over the photo, not baked into
                  the pixels — it is the model number, and a model number
                  inside a JPEG is invisible to search and to a screen reader.
                  `bg-black/70` + `backdrop-blur-sm` so it stays legible over
                  the bright lower-left corner of this particular frame. */}
              <figcaption className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-[11px]">
                {BRAND.name} {BRAND.model} &middot; BNA-510SH
              </figcaption>
            </figure>
          </Reveal>

          {/* RIGHT — the six reasons, hairline-separated.
              A plain <ol> because they are numbered and the order is the
              argument. `list-none` kills the native marker; the 01-06 are
              rendered as their own element so they can be styled and so the
              number is in the text layer rather than a ::marker a crawler
              does not see. */}
          <ol className="list-none">
            {REASONS.map((reason, i) => (
              <Reveal
                key={reason.title}
                as="li"
                y={20}
                // Capped: a stagger that keeps growing down a six-row list
                // leaves the last one arriving half a second late.
                delay={Math.min(i, 3) * 0.05}
                // The hairline between rows, on every row but the first —
                // so the list has five dividers, not six, and no rule sits
                // above the first row or below the last.
                className={i === 0 ? '' : 'border-t border-border-subtle'}
              >
                <div className="flex items-start gap-4 py-6 sm:gap-5 sm:py-7">
                  {/* The number. `tabular-nums` so 01-06 share a width and
                      the titles start on one vertical line. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-xs font-bold tabular-nums tracking-[0.12em] text-accent-soft sm:text-sm"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                      {reason.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{reason.body}</p>
                  </div>

                  {/* THE STAT.
                      `aria-hidden` because it repeats the H3 it sits beside —
                      a screen reader reading both hears the number twice.
                      `whitespace-nowrap` so "1080p" never breaks across two
                      lines, and `shrink-0` so the flex row gives it its full
                      width rather than squeezing it; the title column is the
                      one that reflows.

                      `.stat-number` is the site's existing gradient treatment
                      (app/globals.css) — white into slate, with a solid-white
                      fallback for engines without background-clip. The size
                      floor is lower than `.stat-number-sm` because this one
                      shares a row with text rather than owning a tile. */}
                  <p
                    aria-hidden="true"
                    className="stat-number shrink-0 self-center whitespace-nowrap text-[clamp(1.5rem,4.2vw,2.25rem)] leading-none"
                  >
                    {reason.stat}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* THE FULL READ. A native <details>: the prose is in the server
            HTML for a crawler, the toggle works with no JavaScript, and the
            keyboard and screen-reader behaviour come for free.

            IT SURVIVED THE REDESIGN ON PURPOSE. The brief replaced the card
            LAYOUT, and this is not the cards — it is ~800 words of indexed
            copy and the only long-form text on the homepage. Deleting it to
            change a grid into a list would have been an SEO regression
            smuggled in behind a visual change.

            `group-open:rotate-45` turns the plus into a cross, and
            `motion-reduce:transition-none` drops the tween rather than the
            state — reduced motion still gets the affordance, without the
            movement. `[&::-webkit-details-marker]:hidden` plus
            `list-none` removes the native triangle in both engines. */}
        <Reveal y={20} delay={0.2} className="mt-14">
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
