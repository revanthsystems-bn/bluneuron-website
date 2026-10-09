import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import Reveal from '@/components/Reveal';
import { Download, FileText } from 'lucide-react';
import { SETUP_STEPS } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { MANUALS, TBD, isTBD } from '@/lib/site-config';

export const metadata = {
  title: 'Manuals & Downloads — BluNeuron IRIZ',
  description:
    'The IRIZ quick-start guide, full user manual and warranty card — plus the five-step setup walkthrough.',
  robots: routeRobots(ROUTES.manuals),
};

/**
 * Documents, plus the setup walkthrough that used to live on /support.
 *
 * The setup steps moved HERE rather than to /support/faq because they are not
 * a question — they are the quick-start guide, written out. Putting them on
 * the same page as the PDF of the quick-start guide means the one person who
 * needs them most (a box just opened, no printer, phone in hand) does not have
 * to download anything to follow them.
 *
 * A card whose `file` is still TBD renders as a PLACEHOLDER, not as a download
 * button: a visible "not available yet" is better than a button that produces
 * a 404, and it is also what keeps this page honestly noindexed until the real
 * PDFs land. See MANUALS in lib/site-config.js.
 */
export default function ManualsPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Support"
        title="Manuals & downloads"
        subtitle="Everything that ships in the box, as a document — and the setup walkthrough if you would rather just follow along."
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <DraftBanner path={ROUTES.manuals} className="mb-10 max-w-[680px]" />

          <div className="bento-grid">
            {MANUALS.map((doc, i) => {
              const pending = isTBD(doc.file);

              return (
                <Reveal
                  key={doc.title}
                  delay={Math.min(i, 3) * 0.05}
                  y={20}
                  className="bento-tile p-6 lg:col-span-4"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft">
                    <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>

                  <h3 className="text-base font-semibold text-white">{doc.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{doc.description}</p>

                  <div className="mt-auto pt-5">
                    {pending ? (
                      <p className="text-xs font-medium text-amber-300/80">
                        PDF {TBD} — not available for download yet.
                      </p>
                    ) : (
                      <a
                        href={doc.file}
                        download
                        className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-accent-soft"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Download PDF
                        {!isTBD(doc.size) && (
                          <span className="text-white/40">({doc.size})</span>
                        )}
                      </a>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Getting started</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Setup in five steps
            </h2>
          </Reveal>

          {/* Five steps on the 12-column board: two 6-wide pairs, then the last
              one full width so the row doesn't end on a hole. */}
          <ol className="bento-grid">
            {SETUP_STEPS.map((step, i) => (
              <Reveal
                key={step.title}
                delay={Math.min(i, 3) * 0.05}
                y={20}
                as="li"
                className={`bento-tile flex-row gap-4 p-6 ${
                  i === SETUP_STEPS.length - 1 ? 'sm:col-span-2 lg:col-span-12' : 'lg:col-span-6'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.1} className="mt-8">
            <a href={ROUTES.faq} className="btn-secondary inline-flex">
              FAQ & troubleshooting →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
