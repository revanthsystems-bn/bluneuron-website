import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'About — BluNeuron',
  description: 'Why BluNeuron exists, and why the IRIZ is built around honest brightness claims.',
};

const VALUES = [
  {
    title: 'Measure honestly',
    body: 'The projector industry is full of "LED lumens" numbers measured at the bulb, before any optical loss. We rate the IRIZ in true ANSI lumens — the standardized, independently measurable metric — because the number on the box should be the number on your wall.',
  },
  {
    title: 'Cut what doesn’t matter, keep what does',
    body: 'A built-in smart OS, auto keystone, auto focus, and real audio aren’t upsells to us — they’re what makes a projector usable the day it arrives. We’d rather ship those than a marketing spec that reads bigger on paper.',
  },
  {
    title: 'Stand behind one product',
    body: 'BluNeuron isn’t a catalog of a hundred SKUs. We build one projector at a time, get it right, and support the people who bought it.',
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="About BluNeuron"
        title="A projector brand built around one honest number."
        subtitle="We started BluNeuron because the home-projector market is full of inflated brightness claims — and we wanted to build the projector we couldn't find."
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container max-w-2xl">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tighter text-white">Why IRIZ</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Most budget projectors advertise brightness numbers that don't survive contact with a real room —
              inflated "LED lumens" figures that collapse the moment you turn a lamp on. The IRIZ is our answer:
              a projector rated in true ANSI lumens, with a built-in smart OS so you're not stuck buying a
              separate streaming stick, and the auto-focus and auto-keystone correction that should have been
              standard on budget projectors years ago. It's the projector we wanted to buy and couldn't find, so
              we built it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">What We Care About</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Our approach</h2>
          </Reveal>

          <div className="bento-grid">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06} y={20} className={`bento-tile p-6 lg:col-span-4 ${
                  i === VALUES.length - 1 ? 'sm:col-span-2 lg:col-span-4' : ''
                }`}>
                <h3 className="mb-2 text-base font-semibold text-white">{v.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <Reveal>
            <p className="mx-auto max-w-md text-sm text-white/50">
              Questions about the company or the product? We'd genuinely like to hear from you.
            </p>
            <a href="/support#contact" className="btn-secondary mt-5 inline-flex">
              Get in Touch →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
