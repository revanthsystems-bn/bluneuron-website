'use client';

import Image from 'next/image';
import Reveal from './Reveal';
import { HIGHLIGHTS } from '@/lib/j500';

// Extends the shared HIGHLIGHTS data (single source of truth in lib/j500.js)
// with the richer copy and spec badges this full-bleed showcase needs, without
// duplicating title/subtitle/image — those stay defined once, in one place.
const SECTIONS = [
  {
    eyebrow: 'Smart OS',
    headline: (
      <>
        "Hey Google," <span className="text-[#a3e635]">built right in</span>.
      </>
    ),
    body: 'A full Google TV remote in the box, and "Hey Google" voice search standing by the moment you power on. Android 14 runs the show underneath — no separate streaming stick required.',
    badges: ['Android 14', 'Google TV', 'Voice Remote'],
  },
  {
    eyebrow: 'App Store',
    headline: (
      <>
        <span className="text-[#a3e635]">10,000+ apps</span>, ready on day one.
      </>
    ),
    body: 'Netflix, YouTube, Disney+, and Prime Video — pre-installed and signed in before you\'ve even found a wall to point at. No sideloading, no sketchy APKs.',
    badges: ['10,000+ Apps', 'Pre-Installed'],
  },
  {
    eyebrow: 'Brightness',
    headline: (
      <>
        <span className="text-[#a3e635]">True brightness</span>, measured honestly.
      </>
    ),
    body: '500 ANSI lumens — the industry\'s honest brightness standard, not an inflated spec-sheet number. It holds up in a normally lit room, no blackout curtains required.',
    badges: ['500 ANSI Lumens', 'True Measured'],
  },
  {
    eyebrow: 'Platform',
    headline: <>A quad-core brain built to keep up.</>,
    body: 'Allwinner H723, quad-core ARM Cortex-A53, with hardware keystone correction and video decoding up to 8K — enough headroom to stay smooth for years, not months.',
    badges: ['H723 Chipset', 'Cortex-A53', 'Up to 8K Decode'],
  },
  {
    eyebrow: 'Calibration',
    headline: (
      <>
        <span className="text-[#a3e635]">Perfectly square</span>, automatically.
      </>
    ),
    body: 'Auto keystone correction squares up the image the instant you move the projector — no manual trapezoid sliders, no trial and error, just point and watch it snap true.',
    badges: ['Auto Keystone', 'Auto Focus'],
  },
  {
    eyebrow: 'Screen Size',
    headline: (
      <>
        <span className="text-[#a3e635]">Go big</span> and go home.
      </>
    ),
    body: 'A 1:1 throw ratio means a massive canvas from just 0.9 to 5 meters away — anywhere from a tidy 35" up to a full 200" screen, wherever you point it.',
    badges: ['35" – 200"', '1:1 Throw Ratio'],
  },
].map((section, i) => ({ ...section, ...HIGHLIGHTS[i] }));

export default function Highlights() {
  return (
    <section id="highlights" className="relative bg-[#080808]">
      {SECTIONS.map((item, i) => {
        const imageFirst = i % 2 === 1;

        return (
          <div
            key={item.title}
            className={`relative flex min-h-screen w-full flex-col items-center overflow-hidden lg:flex-row ${
              imageFirst ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <Reveal
              className="section-container relative z-10 flex w-full shrink-0 flex-col justify-center gap-6 py-16 lg:w-[42%] lg:py-0"
              y={24}
            >
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  {item.eyebrow}
                </p>
                <h2 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                  {item.headline}
                </h2>
              </div>
              <div className="max-w-md space-y-4 text-lg text-neutral-400">
                <p>{item.body}</p>
              </div>
            </Reveal>

            <Reveal
              className="relative h-[56vh] w-full flex-1 lg:h-screen lg:w-[58%]"
              y={0}
              delay={0.1}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(8,8,8,1) 70%)',
                }}
              />
              <div className="relative h-full w-full">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="detail-fade object-contain p-8 lg:p-16"
                  priority={i === 0}
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-wrap items-center justify-center gap-3 px-6 lg:bottom-14">
                {item.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-md"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        );
      })}
    </section>
  );
}
