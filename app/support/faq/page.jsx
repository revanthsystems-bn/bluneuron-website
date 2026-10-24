import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import FaqAccordion from '@/components/FaqAccordion';
import { ALL_FAQS, SETUP_STEPS, TROUBLESHOOTING } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { faqJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'IRIZ Setup, FAQ & Troubleshooting — BluNeuron',
    description:
      'Set up the IRIZ in five steps, then answers on brightness, throw distance, Wi-Fi and input lag, and fixes for blurry images, keystone, sound and the remote.',
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
 * Setup, FAQ and troubleshooting, on one page.
 *
 * All three answer the same kind of question — "this has an answer already" —
 * and splitting them across routes would mean guessing, before you read
 * anything, whether "do I need a special screen?" is a question or a problem.
 * Three sections on one page lets Ctrl+F do that job instead.
 *
 * THE SETUP WALKTHROUGH MOVED HERE from /support/manuals when that route was
 * retired (see app/support/_manuals/page.jsx). It was the one piece of
 * confirmed content on that page — the three PDFs it also offered do not
 * exist yet — and leaving it behind a 307 would have made the only
 * first-run instructions on the site unreachable. It leads the page on
 * purpose: someone whose box is open and whose projector is not working yet
 * has not got a question, they have a step they have not done.
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
        title="Setup, FAQ & troubleshooting"
        subtitle="Set it up in five steps, then the questions that get asked most and the fixes for the things that go wrong most."
      />

      {/* SETUP — first, and an <ol>, because the steps are ordered and a
          screen reader should say so. `scroll-mt-24` so /support/faq#setup
          lands below the sticky masthead rather than under it.

          Five steps on the 12-column board: two 6-wide pairs, then the last
          one full width so the row does not end on a hole. Carried over from
          the retired /support/manuals, markup and all, so the walkthrough a
          reader may already have bookmarked looks the same. */}
      <section
        id="setup"
        className="scroll-mt-24 border-b border-border-subtle bg-black py-16 sm:py-20"
      >
        <div className="section-container">
          <div className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Getting started</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Setup in five steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Out of the box to a picture on the wall. Nothing to download — the printed
              quick-start guide in the carton says the same thing.
            </p>
          </div>

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
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-border-subtle bg-black-soft py-16 sm:py-20">
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

      {/* `bg-black` here now. The three sections alternate ground —
          setup (black), FAQ (soft), troubleshooting (black) — and the FAQ
          took the soft one when setup landed above it. Two adjacent sections
          on the same ground read as one long section with a stray hairline
          through it. */}
      <section
        id="troubleshooting"
        className="scroll-mt-24 border-b border-border-subtle bg-black py-16 sm:py-20"
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

      <section className="bg-black-soft py-16 text-center sm:py-20">
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
