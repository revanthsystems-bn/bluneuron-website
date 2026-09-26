'use client';

import Image from 'next/image';
import Reveal from './Reveal';
import { MEDIA } from '@/lib/j500';

// A single, full-bleed cinematic "look" moment — the J500 already lit,
// framed, and correctly branded in-shot — spanning the full viewport with
// no card or border, the way Lumio's showcase punctuates its feature list
// with one big ambient scene instead of another cropped product render.
// The source photo carries its own soft-blurred wide extension either
// side of the real shot, so a full-screen object-cover crop still keeps
// the whole composition (logo, screen, badges) in frame at typical
// viewport widths instead of slicing off the top or bottom.
export default function LifestyleShowcase() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#080808]">
      <Image
        src={MEDIA.product.lifestyleAmbient}
        alt="BluNeuron J500 projecting the bluneuron mark onto a wall in a dark room"
        fill
        sizes="100vw"
        className="object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080808]/70 via-transparent to-transparent" />

      <div className="section-container relative z-10 flex h-full flex-col justify-end pb-20 lg:pb-28">
        <Reveal className="max-w-xl">
          <p className="eyebrow mb-3">The BluNeuron Look</p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Every wall, <span className="text-[#a3e635]">a screen</span>.
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
