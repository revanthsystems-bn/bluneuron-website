import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import { pageMetadata } from '@/lib/seo';

/**
 * The privacy policy — a real document, and the only legal page that does not
 * go through components/LegalPage.
 *
 * That is deliberate. LegalPage hard-codes the amber "DRAFT — placeholder
 * legal text" banner and the "Draft prepared <date>" line, which are still
 * true of /legal/terms, /legal/shipping and /legal/returns and must stay
 * there. This page is no longer a draft, so it cannot use that shell, and
 * stripping the banner from the shell would quietly un-draft the other three.
 *
 * It also needs markup LegalPage's `sections` prop cannot express: bold
 * lead-ins inside list items, a paragraph that follows a list inside the same
 * section, and mailto links. So the prose is written out here, in the same
 * chrome (PageShell + PageHeading) and the same tokens as the rest of the
 * site.
 *
 * Measure is capped at 680px rather than the `max-w-3xl` (768px) the draft
 * pages use — a policy is read, not skimmed, and 680px at 16px keeps lines
 * near the 65-75 character range that is comfortable for continuous text.
 */

const CONTACT_EMAIL = 'systems@bluneuron.com';
const LAST_UPDATED = '16 October 2026';

export const metadata = pageMetadata({
  title: 'Privacy Policy — BluNeuron',
  description:
    'How BluNeuron collects and uses information on bluneuron.com — launch-update signups, site analytics, and the third-party services we rely on.',
  path: '/legal/privacy',
});

/** Section heading. One level below the PageHeading h1. */
function H2({ children }) {
  return <h2 className="mb-3 mt-10 text-xl font-semibold tracking-tight text-white first:mt-0">{children}</h2>;
}

function Mail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeading eyebrow="Legal" title="Privacy Policy" subtitle={`Last updated: ${LAST_UPDATED}`} />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container">
          {/* `max-w-[680px]` on the prose itself, not on the container, so the
              page keeps the same left gutter as every other section. */}
          <div className="max-w-[680px] text-base leading-relaxed text-white/70">
            <p>
              BluNeuron (&ldquo;we&rdquo;, &ldquo;us&rdquo;) makes the IRIZ projector. This policy explains what
              information we collect on bluneuron.com and how we use it.
            </p>

            <H2>What we collect</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                <strong className="font-semibold text-white">When you sign up for launch updates:</strong> your
                email address, and your mobile number if you choose to give it.
              </li>
              <li>
                <strong className="font-semibold text-white">
                  When you register a warranty or make a claim:
                </strong>{' '}
                your name, email address and mobile number; where you bought the unit, your order
                ID, the purchase date and the unit&rsquo;s serial number; and, on a claim, what is
                going wrong and your description of it.
              </li>
              <li>
                <strong className="font-semibold text-white">When you visit the site:</strong> basic information
                about your visit, such as pages viewed, device and browser type, approximate location (country or
                city), and how you arrived (for example, from an ad).
              </li>
            </ul>
            <p className="mt-4">
              Warranty registrations and claims are stored in a Google Sheet that only our support
              team can open. We use them only to register your warranty, to assess a claim against
              it, and to arrange the repair or replacement that follows — never for advertising,
              and none of these details are sent to Google Analytics or the Meta Pixel. If a claim
              cannot be written to that sheet, it is emailed to our support inbox instead so it is
              not lost. You can ask us to delete a registration or a claim at any time by emailing{' '}
              <Mail /> with your registration ID or claim reference.
            </p>
            <p className="mt-4">
              Give us only what a form asks for. A warranty claim needs the serial number and the
              order ID to be assessed; it does not need your address, and the form does not ask for
              one. We never collect payment details — the purchase happens on Amazon or Flipkart,
              and we are not given your card, your UPI ID or your delivery address.
            </p>

            <H2>How we use it</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>To tell you when IRIZ launches and share launch-related updates.</li>
              <li>To understand how people use the site and improve it.</li>
              <li>To measure and improve our advertising on Facebook and Instagram.</li>
            </ul>
            <p className="mt-4">We do not sell your personal information.</p>

            <H2>Services we use</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                <strong className="font-semibold text-white">Web3Forms:</strong> delivers your signup details to
                us.
              </li>
              <li>
                <strong className="font-semibold text-white">Vercel Analytics:</strong> counts visits without
                using cookies. Used only on the version of this site hosted by Vercel.
              </li>
              <li>
                <strong className="font-semibold text-white">Google Analytics 4:</strong> counts visits and
                measures which pages people use. It uses cookies. We have switched off Google&rsquo;s
                advertising and cross-device features for this site, so the data is not used to personalise ads
                or linked to a Google account, and we never send your name, email address or phone number to
                it. Google processes this data under its own privacy policy. You can opt out across all sites
                with Google&rsquo;s browser add-on at{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  tools.google.com/dlpage/gaoptout
                </a>
                .
              </li>
              <li>
                <strong className="font-semibold text-white">Meta Pixel (Facebook/Instagram):</strong> uses
                cookies to measure visits and signups from our ads. Meta processes this data under its own
                privacy policy. You can limit ad tracking in your browser settings or your Facebook/Instagram ad
                settings.
              </li>
            </ul>

            <H2>How long we keep it</H2>
            <p>
              We keep your signup details until IRIZ launches and for a reasonable period after, or until you ask
              us to delete them.
            </p>

            <H2>Your choices</H2>
            <p>
              You can ask us to see, correct or delete your information, or stop receiving updates at any time,
              by emailing <Mail />. Every update email also lets you unsubscribe.
            </p>

            <H2>Children</H2>
            <p>This site is not intended for anyone under 18.</p>

            <H2>Changes</H2>
            <p>We may update this policy. The date at the top shows the latest version.</p>

            <H2>Contact</H2>
            <p>
              BluNeuron, India. Email: <Mail />
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
