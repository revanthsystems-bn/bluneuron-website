import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import { FULL_SPEC_SHEET, BOX_CONTENTS, WARRANTY, SHOW_PENDING_SPECS } from '@/lib/iriz';
import { pageMetadata } from '@/lib/seo';

// The groups this page actually renders. Everything still lives in
// FULL_SPEC_SHEET; the pending-detail groups are filtered out here rather than
// removed from the data, so SHOW_PENDING_SPECS alone brings them back.
// See SHOW_PENDING_SPECS in lib/iriz.js.
const SPEC_GROUPS = FULL_SPEC_SHEET.filter((group) => SHOW_PENDING_SPECS || !group.pending);

// Bento spans for the spec groups, on the 12-column board. Rows must total 12,
// so these change in pairs — and there is one set per flag state, because the
// group count changes with it:
//
//   pending shown   7+5 / 7+5 / 12 — the four dense groups pair off by size,
//                   and "Dimensions & Weight" (two placeholder rows) closes
//                   the board as a wide strip rather than a mostly-empty
//                   column. `lg:col-span-12` is also what splits that group's
//                   list into two columns, via `wide` below.
//   pending hidden  7+5 / 7+5 — the four dense groups, two even rows, no
//                   trailing cell to fill and nothing wide.
const GROUP_SPANS = SHOW_PENDING_SPECS
  ? ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-5', 'lg:col-span-12']
  : ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-5'];

export const metadata = pageMetadata({
  title: 'IRIZ Full Specifications — 1080p, 500 ANSI Lumens | BluNeuron',
  // Describes what the page actually lists, which the flag decides. Promising
  // "dimensions, box contents, and warranty" while they are hidden would be a
  // description search engines show for content that is not there.
  description: SHOW_PENDING_SPECS
    ? 'Full specifications for the BluNeuron IRIZ mini projector: native 1080p optics, 500 ANSI lumens, connectivity, dimensions, box contents and warranty.'
    : 'Full specifications for the BluNeuron IRIZ mini projector: native 1080p optics and display, throw and screen size, Google TV platform and connectivity.',
  path: '/specs',
});

export default function SpecsPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Full Spec Sheet"
        title="Every spec, in one place."
        subtitle="The complete technical breakdown for the BluNeuron IRIZ — no rounding, no marketing shorthand."
      />

      {/* `border-b` stays with this section, not with the one below it: it is
          the hairline above the closing "View Comparison" block, and that
          block is what follows whether or not the pending section renders. */}
      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container bento-grid">
          {SPEC_GROUPS.map((group, i) => {
            const span = GROUP_SPANS[i] ?? 'lg:col-span-6';
            // Both keyed off the full-width span, not off "is this the last
            // group": with the pending group hidden the last group is an
            // ordinary half-width tile, and `sm:col-span-2` on it would
            // stretch it across the two-column phone/tablet board.
            const wide = span === 'lg:col-span-12';
            const smSpan = wide ? 'sm:col-span-2' : '';
            return (
              <Reveal
                key={group.group}
                delay={Math.min(i, 3) * 0.05}
                y={20}
                className={`bento-tile p-6 sm:p-8 ${smSpan} ${span}`}
              >
                <h2 className="mb-5 text-lg font-semibold text-white">{group.group}</h2>
                <dl className={wide ? 'grid gap-x-10 sm:grid-cols-2' : 'divide-y divide-border-subtle'}>
                  {group.rows.map(([label, value]) => (
                    <div
                      key={label}
                      className={`flex items-start justify-between gap-6 py-3 ${
                        wide
                          ? 'border-b border-border-subtle last:border-b-0 sm:border-b-0 sm:py-0'
                          : 'first:pt-0 last:pb-0'
                      }`}
                    >
                      <dt className="text-sm text-white/50">{label}</dt>
                      <dd className="text-right text-sm font-medium text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* "In the Box" and "Warranty" are both unconfirmed (see
          SHOW_PENDING_SPECS in lib/iriz.js), so the gate is on the <section>
          itself — not on the two tiles inside it. Gating the tiles would leave
          this section's padding and bottom hairline behind as a blank band
          between the board above and the comparison block below. */}
      {SHOW_PENDING_SPECS && (
        <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
          <div className="section-container bento-grid">
            <Reveal y={20} className="bento-tile p-6 sm:p-8 lg:col-span-7">
              <h2 className="mb-5 text-lg font-semibold text-white">In the Box</h2>
              <ul className="space-y-2.5 text-sm text-white/70">
                {BOX_CONTENTS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.05} y={20} className="bento-tile p-6 sm:p-8 lg:col-span-5">
              <h2 className="mb-5 text-lg font-semibold text-white">Warranty</h2>
              <p className="text-sm text-white/70">{WARRANTY.summary}</p>
              <p className="mt-4 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                {WARRANTY.note}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <Reveal>
            <p className="text-sm text-white/50">
              See how these numbers stack up against typical budget projectors.
            </p>
            <a href="/compare" className="btn-secondary mt-5 inline-flex">
              View Comparison →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
