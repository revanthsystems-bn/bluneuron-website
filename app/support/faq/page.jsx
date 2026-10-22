import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { ALL_FAQS, TROUBLESHOOTING } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { faqJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'FAQ & Troubleshooting — BluNeuron IRIZ',
    description:
      'Answers about brightness, throw distance, Wi-Fi, input lag and connectivity — plus fixes for blurry images, keystone, sound and the remote.',
    path: ROUTES.faq,
  }),
  robots: routeRobots(ROUTES.faq),
};

// FAQPage, derived from the same FAQS array the accordion renders below — see
// faqJsonLd in lib/seo.js for why it is derived and never retyped. It lives
// here rather than on /support because Google requires the markup to match the
// questions VISIBLE on the page, and /support is now a hub of tiles with no
// questions on it at all.
const FAQ_JSON_LD = faqJsonLd(ALL_FAQS);

/**
 * FAQ and troubleshooting, on one page.
 *
 * Both lists answer the same kind of question — "this has an answer already" —
 * and splitting them across two routes would mean guessing, before you read
 * anything, whether "do I need a special screen?" is a question or a problem.
 * Two sections on one page lets Ctrl+F do that job instead.
 *
 * Neither list quotes a business detail, which is why this page is NOT a draft
 * and stays indexable: every answer here comes from the manufacturer's own
 * material via lib/iriz.js. Anything that depends on the warranty length or
 * the return window deliberately lives on the policy pages instead, where the
 * [TBD] placeholders are visible and the page is noindexed until they are
 * filled in.
 */
export default function FaqPage() {
  return (
    <PageShell>
      {/* No scroll reveal anywhere under /support: see components/Reveal.jsx.
          Support pages are read, not browsed, and a good share of this traffic
          is an in-app browser opened by a QR scan, where the bundle may never
          land. They are plain, static, visible markup. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <PageHeading
        eyebrow="Support"
        title="FAQ & troubleshooting"
        subtitle="The questions that get asked most, and the fixes for the things that go wrong most."
      />

      <section id="faq" className="scroll-mt-24 border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          {/* NO "COMMON QUESTIONS / FAQ" HEADING HERE.
              The PageHeading above already reads "FAQ & troubleshooting" and
              says what the page is; a second "FAQ" eight hundred pixels
              further down was the same word twice in two type sizes, with
              nothing between them. The accordion's own topic headings are
              the structure this section needs. */}
          <FaqAccordion items={ALL_FAQS} searchable />
        </div>
      </section>

      <section
        id="troubleshooting"
        className="scroll-mt-24 border-b border-border-subtle bg-black-soft py-16 sm:py-20"

      >
        <div className="section-container">
          <div className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Something not working?</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Troubleshooting
            </h2>
          </div>

          <div className="bento-grid">
            {TROUBLESHOOTING.map((item, i) => (
              <div
                key={item.issue}
                className={`bento-tile p-6 ${
                  i === TROUBLESHOOTING.length - 1 ? 'sm:col-span-2 lg:col-span-12' : 'lg:col-span-6'
                }`}
              >
                <h3 className="mb-2 text-sm font-semibold text-white">{item.issue}</h3>
                <p className="text-sm leading-relaxed text-white/55">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <div>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/50">
              Still stuck, or think your unit has a fault? Tell us what is happening.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={ROUTES.contact} className="btn-secondary justify-center">
                Contact support
              </a>
              <a href={ROUTES.warrantyClaim} className="btn-secondary justify-center">
                Make a warranty claim
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
