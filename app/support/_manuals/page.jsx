import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import DraftBanner from '@/components/DraftBanner';
import { Download, FileText } from 'lucide-react';
import { MEDIA } from '@/lib/iriz';
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
 * THE SETUP WALKTHROUGH IS NOT HERE ANY MORE, and must not come back with
 * the documents. "Setup in five steps" was the one piece of confirmed content
 * on this page, so it moved to /support/faq, where it now LEADS the page: the
 * question it answers is "how do I set this up", which belongs with the other
 * questions, and leaving it behind a 307 would have made the only first-run
 * instructions on the site unreachable.
 *
 * So the section is deleted from this file rather than left commented out.
 * Restoring this page must NOT re-add it — SETUP_STEPS would then render on
 * two routes and the same walkthrough would be indexed twice.
 *
 * ---------------------------------------------------------------------------
 *
 * The documents.
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

    </PageShell>
  );
}
