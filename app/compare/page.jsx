import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import ComparisonTable from '@/components/ComparisonTable';
import Reveal from '@/components/Reveal';
import { COMPARISON } from '@/lib/iriz';

export const metadata = {
  title: 'IRIZ vs. Others — BluNeuron IRIZ',
  description:
    'See how the BluNeuron IRIZ compares to typical budget projectors on brightness, resolution, smart OS, audio, and more.',
};

const EXTRA_ROWS = [
  { label: 'Voice Assistant', iriz: 'Built-in "Hey Google"', other: 'Not available' },
  { label: 'App Store', iriz: '10,000+ official apps, pre-installed', other: 'Sideloading required, if supported' },
  { label: 'Video Decoding', iriz: 'Up to 8K (decode)', other: 'Typically 1080p or lower' },
  { label: 'Chipset', iriz: 'Allwinner H723, Quad-core Cortex-A53', other: 'Often unnamed/unspecified' },
  { label: 'Projection Distance', iriz: '0.9m – 5m', other: 'Varies, often more restrictive' },
];

export default function ComparePage() {
  const rows = [...COMPARISON.rows, ...EXTRA_ROWS];

  return (
    <PageShell>
      <PageHeading
        eyebrow="IRIZ vs. Others"
        title='Not all "500 lumens" are the same.'
        subtitle="A side-by-side look at where the BluNeuron IRIZ pulls ahead of a typical budget projector."
      />

      <ComparisonTable
        eyebrow="Full Comparison"
        heading="Every category, head to head."
        columns={COMPARISON.columns}
        rows={rows}
        showViewMore={false}
      />

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container max-w-2xl">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tighter text-white">A note on "lumens"</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Many budget projectors advertise "LED lumens" or "light source lumens" — a number measured at the
              bulb, before any glass, housing, or optical loss. It has no standardized relationship to what you
              actually see on the wall. ANSI lumens is the industry's standardized, independently measurable
              brightness metric. The BluNeuron IRIZ is rated at 500 true ANSI lumens — the number on the spec
              sheet is the number you get.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <Reveal>
            <a href="/specs" className="btn-secondary inline-flex">
              View Full Spec Sheet →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
