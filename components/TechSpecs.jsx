import Image from 'next/image';
import Reveal from './Reveal';
import CountUp from './CountUp';
import { SPECS, MEDIA } from '@/lib/j500';

export default function TechSpecs({
  eyebrow = 'Under the Hood',
  heading = 'Engineered for real rooms, not spec sheets.',
  specs = SPECS,
  image = MEDIA.detail.chipset,
  imageAlt = 'Allwinner H723 chipset render',
}) {
  return (
    <section id="specs" className="border-b border-border-subtle bg-black-soft py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="max-w-lg">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">{heading}</h2>
        </Reveal>

        {/* Bento grid: the chipset render anchors the block as a big tile,
            each spec gets its own card, and dense packing fills the gaps
            around them — same visual language as the Highlights section. */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:[grid-auto-flow:dense]">
          {/* object-contain (not cover): the chipset render is a tall portrait
              graphic, and this tile is wide — cover would crop most of it
              away instead of just cropping its edges. */}
          <Reveal className="glass-card relative col-span-2 row-span-2 min-h-[320px] overflow-hidden bg-black-elevated sm:min-h-[380px]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-contain p-6"
            />
          </Reveal>

          {specs.map((spec, i) => (
            <Reveal key={spec.label} delay={i * 0.05} className="glass-card flex flex-col justify-center p-5">
              <dt className="text-xs uppercase tracking-wide text-white/45">{spec.label}</dt>
              <dd className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                <CountUp value={spec.value} />
              </dd>
              <dd className="mt-0.5 text-xs text-white/50">{spec.unit}</dd>
            </Reveal>
          ))}

          <Reveal className="glass-card flex flex-col items-start justify-center p-5">
            <p className="text-sm font-semibold text-white">Want the full sheet?</p>
            <a
              href="#compare"
              className="mt-2 text-sm font-semibold text-accent-soft underline-offset-4 hover:underline"
            >
              See full specs →
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
