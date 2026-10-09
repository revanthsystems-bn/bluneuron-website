import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import SupportTiles from '@/components/SupportTiles';
import Reveal from '@/components/Reveal';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';

export const metadata = {
  title: 'Support — BluNeuron IRIZ',
  description:
    'Register a warranty, make a claim, read the FAQ and troubleshooting, download manuals, or contact BluNeuron support.',
  robots: routeRobots(ROUTES.support),
};

/**
 * The support HUB.
 *
 * This page used to be the whole support section on one scroll: a setup guide,
 * the FAQ, troubleshooting, and a contact form stacked five screens deep. That
 * works while support is four things. It stops working the moment warranty
 * registration, claims and manuals exist — the two things a real owner comes
 * here to DO would have been buried below several screens of reading, and
 * neither had a URL anyone could be sent to.
 *
 * So the content moved to pages that can be linked, and this page became the
 * index of them:
 *
 *   setup guide        → /support/manuals, with the documents it belongs with
 *   FAQ                → /support/faq
 *   troubleshooting    → /support/faq, alongside the FAQ (both are "my
 *                        question has an answer already")
 *   contact form       → /support/contact
 *
 * The old in-page anchors (/support#faq, /support#contact) are gone with them.
 * Every link that used them has been repointed at the new routes — see
 * lib/routes.js, which is now the only place any of these paths is spelled.
 */
export default function SupportPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Support"
        title="We've got you covered."
        subtitle={`Everything for your ${BRAND.model} in one place — warranty, answers, documents, and a direct line to our team.`}
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <SupportTiles />
        </div>
      </section>

      {/* One destination repeated below the tiles, on purpose. Someone whose
          problem is not on any tile should not have to work out which tile is
          closest — "none of these" needs its own exit, and it is the last
          thing on the page where they will be looking for it. */}
      <section className="bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="glass-panel flex flex-col gap-6 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold tracking-tighter text-white">
                Not sure where to start?
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                Tell us what is happening and we will point you at the right thing — no bots, no
                ticket queue purgatory.
              </p>
            </div>
            <a href={ROUTES.contact} className="btn-primary shrink-0 justify-center">
              Contact support
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
