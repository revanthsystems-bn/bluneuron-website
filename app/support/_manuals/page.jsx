import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import DraftBanner from '@/components/DraftBanner';
import { Download, FileText } from 'lucide-react';
import { SETUP_STEPS, MEDIA } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MANUALS, TBD, isTBD } from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'Manuals & Downloads — BluNeuron IRIZ',
    description:
      'The IRIZ quick-start guide, full user manual and warranty card — plus the five-step setup walkthrough.',
    path: ROUTES.manuals,
  }),
  robots: routeRobots(ROUTES.manuals),
};

/**
 * ===================================================================
 * PARKED. THIS FILE IS NOT A ROUTE, AND IT WILL NOT COMPILE AS ONE.
 * ===================================================================
 *
 * The folder is `_manuals`, and Next excludes an underscore-prefixed folder
 * from the router — so nothing here is built and /support/manuals does not
 * exist. next.config.js 307s that path to /support, because the URL has been
 * linked and indexed and a 404 would be truthful and useless.
 *
 * WHY: none of the three PDFs exists. MANUALS in lib/site-config.js carries
 * `file: TBD` for all three, so this page rendered as three cards reading
 * "PDF [TBD] — not available for download yet" behind a nav entry, a footer
 * link, a support tile and a sitemap entry. A support link that leads to
 * nothing is worse than no link.
 *
 * IT IS KEPT, UNCHANGED, so restoring it is a rename and five one-line edits
 * rather than a rebuild. TO RESTORE:
 *
 *   1. Put the PDFs in public/ and fill in `file` and `size` for each entry
 *      in MANUALS (lib/site-config.js). Do this FIRST — the rest of the list
 *      only un-hides the page, it does not give it anything to serve.
 *   2. Rename this folder back to `manuals`.
 *   3. lib/routes.js: restore `manuals: '/support/manuals'` in ROUTES, the
 *      SUPPORT_TILES entry, the FOOTER_COLUMNS link, the SITEMAP_CANDIDATES
 *      entry and the DRAFT_SOURCES line. All five carry a comment saying so.
 *   4. next.config.js: delete the /support/manuals redirect.
 *   5. scripts/ui-audit.mjs, content-audit.mjs and csp-report.mjs: add the
 *      route back to their ROUTES lists.
 *
 * UNTIL THEN IT REFERENCES `ROUTES.manuals`, WHICH IS UNDEFINED. That is
 * deliberate and it is safe only because this file is not compiled: it means
 * a careless rename without step 3 fails loudly at build time rather than
 * shipping a page with no canonical and no robots tag.
 *
 * NOTE, AND IT IS A REAL LOSS: the "Setup in five steps" walkthrough at the
 * bottom of this page went with it. SETUP_STEPS (lib/iriz.js) is confirmed
 * content and is now rendered nowhere. It belongs on /support/faq — the
 * question it answers is "how do I set this up" — and moving it there is a
 * separate change from retiring the documents.
 *
 * ---------------------------------------------------------------------------
 *
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
      {/* No scroll reveal anywhere under /support: see components/Reveal.jsx.
          Support pages are read, not browsed, and a good share of this traffic
          is an in-app browser opened by a QR scan, where the bundle may never
          land. They are plain, static, visible markup. */}
      <PageHero
        eyebrow="Support"
        title="Manuals & downloads"
        subtitle="Everything that ships in the box, as a document — and the setup walkthrough if you would rather just follow along."
        image={MEDIA.product.boxFront}
        imagePosition="58% 50%"
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <DraftBanner path={ROUTES.manuals} className="mb-10 max-w-[680px]" />

          <div className="bento-grid">
            {MANUALS.map((doc, i) => {
              const pending = isTBD(doc.file);

              return (
                <div
                  key={doc.title}
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
                          <span className="text-white/55">({doc.size})</span>
                        )}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <div className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Getting started</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Setup in five steps
            </h2>
          </div>

          {/* Five steps on the 12-column board: two 6-wide pairs, then the last
              one full width so the row doesn't end on a hole. */}
          <ol className="bento-grid">
            {SETUP_STEPS.map((step, i) => (
              <li
                key={step.title}
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
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <a href={ROUTES.faq} className="btn-secondary inline-flex">
              FAQ & troubleshooting →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
