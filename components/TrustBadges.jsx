'use client';

import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import Reveal from './Reveal';
import CountUp from './CountUp';
import { TRUST_BADGES } from '@/lib/iriz';

const ICONS = { truck: Truck, shield: ShieldCheck, returns: RotateCcw, support: Headphones };

// A hover gesture per icon that means what the promise means: the truck
// drives off, the shield braces, the returns arrow winds back, the headset
// leans in.
const ICON_MOTION = {
  truck: 'group-hover:translate-x-1',
  shield: 'group-hover:scale-110',
  returns: 'group-hover:-rotate-[140deg]',
  support: 'group-hover:-translate-y-0.5',
};

// Bento spans on the 12-column board: the 30-day trial anchors the left as a
// 5-wide tile two rows deep, dispatch and encryption split the top right
// (4+3), and the concierge tile runs the full 7 beneath them.
//   row 1 → 5 (feature) + 4 + 3 = 12
//   row 2 → 5 (feature, continued) + 7 = 12
// Both rows must total 12 or the board opens a hole, so change these in sets.
const SPANS = [
  'sm:col-span-2 lg:col-span-5 lg:row-span-2',
  'lg:col-span-4',
  'lg:col-span-3',
  'sm:col-span-2 lg:col-span-7',
];

// Writes the pointer position onto the tile as CSS custom properties, which
// `.spotlight` reads to place its highlight. Deliberately not React state —
// this fires on every mouse move, and a re-render per frame would be absurd
// for something only CSS consumes.
function trackPointer(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export default function TrustBadges() {
  const [feature, ...rest] = TRUST_BADGES;
  const FeatureIcon = ICONS[feature.icon];

  return (
    // `scroll-mt-20` clears the fixed masthead when the hero's scroll cue
    // lands here.
    <section
      id="why-bluneuron"
      className="relative scroll-mt-20 overflow-hidden border-b border-border-subtle bg-black py-20 sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,180,255,0.11) 0%, transparent 68%)',
        }}
      />

      <div className="section-container relative">
        <Reveal className="mb-12 max-w-2xl">
          <p className="eyebrow mb-3">Why Shop BluNeuron</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Every promise here has a{' '}
            <span className="text-cyan-300">number</span> behind it.
          </h2>
        </Reveal>

        <div className="bento-grid">
          {/* ---- Feature tile: the 30-day trial ---- */}
          <Reveal
            y={20}
            onMouseMove={trackPointer}
            className={`bento-tile spotlight group justify-between gap-8 p-7 sm:p-9 ${SPANS[0]}`}
          >
            <span aria-hidden="true" className="rim-orbit" />

            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10">
                {FeatureIcon && (
                  <FeatureIcon
                    className={`h-5 w-5 text-cyan-300 transition-transform duration-500 ${ICON_MOTION[feature.icon]}`}
                    strokeWidth={1.75}
                  />
                )}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
                Our best reason
              </span>
            </div>

            <div className="relative w-fit">
              {/* Rings stack in one grid cell behind the number; they scale,
                  so they can't be centred with a translate. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid place-items-center"
              >
                <span className="halo-ring col-start-1 row-start-1 h-44 w-44" />
                <span
                  className="halo-ring col-start-1 row-start-1 h-44 w-44"
                  style={{ animationDelay: '1.35s' }}
                />
                <span
                  className="halo-ring col-start-1 row-start-1 h-44 w-44"
                  style={{ animationDelay: '2.7s' }}
                />
              </span>

              <p className="relative flex items-baseline gap-3">
                <CountUp
                  value={feature.stat}
                  className="text-[6rem] font-semibold leading-[0.82] tracking-tighter text-white sm:text-[8rem]"
                />
                <span className="text-lg font-medium uppercase tracking-[0.15em] text-cyan-300">
                  {feature.unit}
                </span>
              </p>
            </div>

            <div className="relative">
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
                {feature.text}
              </p>
              <a
                href="/legal/returns"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 underline-offset-4 transition-colors hover:text-cyan-200 hover:underline"
              >
                Read the returns policy
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </div>
          </Reveal>

          {/* ---- The other three ---- */}
          {rest.map((b, i) => {
            const Icon = ICONS[b.icon];
            return (
              <Reveal
                key={b.title}
                delay={(i + 1) * 0.08}
                y={20}
                onMouseMove={trackPointer}
                className={`bento-tile spotlight group justify-between gap-6 p-6 sm:p-7 ${SPANS[i + 1]}`}
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                  {Icon && (
                    <Icon
                      className={`h-[18px] w-[18px] text-cyan-300 transition-transform duration-500 ${ICON_MOTION[b.icon]}`}
                      strokeWidth={1.75}
                    />
                  )}
                </span>

                <div className="relative">
                  <p className="flex items-baseline gap-2">
                    <CountUp
                      value={b.stat}
                      className="text-4xl font-semibold leading-none tracking-tighter text-white sm:text-5xl"
                    />
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-cyan-300/90">
                      {b.unit}
                    </span>
                  </p>
                  <h3 className="mt-3 text-base font-semibold text-white">{b.title}</h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/55">{b.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
