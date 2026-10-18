import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, SUPPORT } from '@/lib/site-config';

/**
 * The privacy policy — the only legal page that does not go through
 * components/LegalPage.
 *
 * LegalPage takes `sections` of plain strings and lists. This page needs
 * markup that shape cannot express: bold lead-ins inside list items,
 * paragraphs that follow a list inside one section, and mailto and external
 * links. So the prose is written out here, in the same chrome (PageShell +
 * PageHeading) and the same tokens as every other page.
 *
 * (It was also, once, the only policy page that was NOT a draft, which is the
 * original reason it was split out. That is no longer the distinction — the
 * other pages are finished now and LegalPage's banner is driven from
 * lib/routes.js rather than hardcoded — but the markup reason stands on its
 * own.)
 *
 * WHAT CHANGED when the support hub landed: this policy described a site
 * whose only form was a launch-list signup asking for an email and an
 * optional phone number. There are now three more forms — warranty
 * registration, warranty claim and contact — collecting a name, a mobile
 * number, a marketplace, an order ID, a purchase date and a serial number.
 * A privacy policy that does not mention the data the site's main forms
 * collect is not a disclosure, so the "What we collect" section is written
 * per form, naming the fields.
 *
 * The contact details are no longer a bare brand name and an inbox: the
 * registered entity and its address come from lib/site-config.js, the same
 * values the footer discloses.
 *
 * Measure is capped at 680px — a policy is read, not skimmed, and 680px at
 * 16px keeps lines near the 65-75 characters comfortable for continuous text.
 */

const CONTACT_EMAIL = SUPPORT.email;

/**
 * This policy's own date, separate from POLICY_LAST_UPDATED.
 *
 * The shared constant dates the four documents that were written together
 * (terms, warranty, returns, shipping). This one has been revised since —
 * for accounts, and again for where a warranty registration is stored — and
 * a "last updated" that moves on documents whose text did not change is the
 * one line on a policy page a reader uses to decide whether to re-read it.
 * See the note on POLICY_LAST_UPDATED in lib/site-config.js, which asked for
 * exactly this split the moment it stopped being true.
 */
const PRIVACY_LAST_UPDATED = '16 October 2026';

export const metadata = pageMetadata({
  title: 'Privacy Policy — BluNeuron',
  description:
    'What BluNeuron collects on bluneuron.com — launch signups, warranty and support forms, and the analytics services we use — and how to have it deleted.',
  path: ROUTES.privacy,
});

/** Section heading. One level below the PageHeading h1. */
function H2({ children }) {
  return (
    <h2 className="mb-3 mt-10 text-step-4 font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h2>
  );
}

function Mail({ address = CONTACT_EMAIL }) {
  return (
    <a
      href={`mailto:${address}`}
      className="text-white underline underline-offset-2 transition-colors hover:text-ink-2"
    >
      {address}
    </a>
  );
}

function Ext({ href, children }) {
  return (
    <a
      href={href}
      className="text-white underline underline-offset-2 transition-colors hover:text-ink-2"
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${PRIVACY_LAST_UPDATED}`}
      />

      <section className="bg-black section-y">
        <div className="section-container">
          {/* `max-w-prose-wide` on the prose itself, not on the container, so the
              page keeps the same left gutter as every other section. */}
          <Reveal className="max-w-prose-wide text-step-3 leading-relaxed text-ink-2">
            <p>
              {COMPANY.brandName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a brand of{' '}
              {COMPANY.legalName}, which makes the IRIZ projector. This policy explains what
              information we collect on bluneuron.com, what we do with it, and how to have it
              removed.
            </p>
            <p className="mt-4">
              We do not sell on this website. Buying an IRIZ happens on Amazon or Flipkart, and the
              personal data in that transaction — your address, your payment details, your invoice
              — is collected and held by the marketplace under their privacy policy, not ours. We
              never see your card details, and we are not given your delivery address.
            </p>

            <H2>What we collect</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
              <li>
                <strong className="font-semibold text-white">Launch-list signup:</strong> your email
                address, your name if you give it, and your mobile number if you choose to add one.
              </li>
              <li>
                <strong className="font-semibold text-white">
                  Warranty registration and warranty claims:
                </strong>{' '}
                your name, email address and mobile number, which marketplace you bought from, your
                order ID, the purchase date, the unit&rsquo;s serial number, and — on a claim — your
                description of what is going wrong.
              </li>
              <li>
                <strong className="font-semibold text-white">Contact form:</strong> your name, your
                email address, and your message.
              </li>
              <li>
                <strong className="font-semibold text-white">If you create an account:</strong> your
                email address (which is also how you sign in), and your name and mobile number if
                you add them. If you save an address for a service pickup, we hold that too. Units
                you register are kept with their marketplace, order ID, purchase date and serial
                number, along with any warranty claim you raise and its status.
              </li>
              <li>
                <strong className="font-semibold text-white">When you register a product:</strong>{' '}
                the details above are recorded in two places — our support team&rsquo;s records, so
                they can answer a claim, and (if you are signed in) your own account, so the unit
                and its warranty end date appear under My products &amp; warranty. One registration
                creates one record in each; it is not stored twice over.
              </li>
              <li>
                <strong className="font-semibold text-white">When you visit the site:</strong> basic
                information about the visit, such as pages viewed, device and browser type,
                approximate location (country or city), and how you arrived — for example, from an
                ad.
              </li>
            </ul>
            <p className="mt-4">
              Give us only what a form asks for. A warranty claim needs the serial number and the
              order ID to be assessed; it does not need your address, and the form does not ask for
              one.
            </p>
            <p className="mt-4">
              We never ask for a password. Signing in sends a six-digit code to your email address
              and that is the whole of it — there is no password for us to store or for anyone to
              steal. We do not collect payment details at any point: the purchase happens on Amazon
              or Flipkart, and we are not given your card, your UPI ID or your delivery address.
            </p>

            <H2>How we use it</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
              <li>To answer your message, and to reply to you about a support request.</li>
              <li>
                To register a unit&rsquo;s warranty, to assess a claim against it, and to arrange
                the repair or replacement that follows.
              </li>
              <li>To tell you when IRIZ launches, if you asked us to.</li>
              <li>
                To keep your account: to sign you in, to show you the units you have registered and
                when their warranty ends, and to pre-fill a claim so you do not retype what we
                already hold.
              </li>
              <li>To understand how people use the site and improve it.</li>
              <li>To measure and improve our advertising on Facebook and Instagram.</li>
            </ul>
            <p className="mt-4">We do not sell your personal information.</p>

            <H2>Services we use</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
              <li>
                <strong className="font-semibold text-white">Web3Forms:</strong> delivers every form
                on this site — the signup, the warranty forms and the contact form — to our inbox.
                The details you type go to them in transit and to us; the site itself has no
                database and stores nothing.
              </li>
              <li>
                <strong className="font-semibold text-white">Google Analytics 4:</strong> counts
                visits and measures which pages people use. It uses cookies. Google&rsquo;s
                advertising and cross-device features are switched off for this site, so the data is
                not used to personalise ads or linked to a Google account, and we never send your
                name, email address, phone number, order ID or serial number to it. Google processes
                this data under its own privacy policy. You can opt out across all sites with
                Google&rsquo;s browser add-on at{' '}
                <Ext href="https://tools.google.com/dlpage/gaoptout">
                  tools.google.com/dlpage/gaoptout
                </Ext>
                .
              </li>
              <li>
                <strong className="font-semibold text-white">Meta Pixel (Facebook/Instagram):</strong>{' '}
                uses cookies to measure visits, signups and clicks through to a marketplace listing
                from our ads. It is sent the fact that one of those happened and nothing about you:
                no name, no email address, no phone number, no order details. Meta processes this
                data under its own privacy policy. You can limit ad tracking in your browser
                settings or in your Facebook/Instagram ad settings.
              </li>
              <li>
                <strong className="font-semibold text-white">Vercel Analytics:</strong> counts visits
                without using cookies. It runs only on a copy of this site hosted by Vercel — the
                live site at www.bluneuron.com does not load it.
              </li>
              <li>
                <strong className="font-semibold text-white">Supabase:</strong> stores your account —
                your sign-in, your profile, your saved addresses, your registered units and your
                claims — and sends the six-digit sign-in code. They process this on our behalf and
                do not use it for anything of their own. The database is hosted in their Mumbai
                (ap-south-1) region, so your account data stays in India. Access is enforced
                row-by-row in the database itself: a signed-in person can read and change their own
                rows and nobody else&rsquo;s.
              </li>
              <li>
                <strong className="font-semibold text-white">Google Workspace:</strong> delivers the
                sign-in code from support@bluneuron.com, and hosts the Google Sheet our support team
                works from. Warranty registrations are written to that sheet — your name, email
                address, mobile number, where you bought the unit, your order ID, the purchase date
                and the serial number. The sheet is restricted to named members of the BluNeuron
                team; it is not shared by link and is not public. Google processes this under its
                own privacy policy and does not use it for anything of its own.
              </li>
            </ul>
            <p className="mt-4">
              Amazon and Flipkart set their own cookies on their own sites. Clicking through to a
              listing takes you to them, and from that point their privacy policy applies.
            </p>

            <H2>How long we keep it</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
              <li>
                <strong className="font-semibold text-white">Warranty and claim records:</strong> for
                the length of the warranty and a reasonable period after it, because a later claim
                is assessed against them.
              </li>
              <li>
                <strong className="font-semibold text-white">Support and contact messages:</strong>{' '}
                for as long as needed to resolve the matter and handle any follow-up.
              </li>
              <li>
                <strong className="font-semibold text-white">Launch-list signups:</strong> until
                launch and for a reasonable period after, or until you ask us to delete them.
              </li>
              <li>
                <strong className="font-semibold text-white">Account data:</strong> for as long as
                you keep the account. Delete it from your account settings and your profile,
                addresses, registered units and claim history are removed immediately.
              </li>
              <li>
                <strong className="font-semibold text-white">Warranty registrations:</strong> for
                the length of the warranty and a reasonable period after it, in both places they
                are held, because a later claim is assessed against them. Deleting your account
                removes your copy; the support team&rsquo;s record is removed on request — email{' '}
                <Mail /> with the serial number.
              </li>
            </ul>

            <H2>Your choices</H2>
            <p>
              You can ask us to show you, correct or delete the information we hold about you, or
              stop sending you updates, at any time by emailing <Mail />. Every update email also
              carries an unsubscribe link. Deleting a warranty registration is your decision to make
              and your record to lose — we cannot assess a later claim from a record that is gone,
              so we will say so before acting on the request.
            </p>
            <p className="mt-4">
              If you have an account you can do most of this yourself, without asking: edit your
              profile, add and remove addresses, and use{' '}
              <strong className="font-semibold text-white">Delete my account and data</strong> in
              your account settings to erase your profile, addresses, registered units and claims.
              Your sign-in record — your email address, nothing else — is removed by us when you
              email <Mail /> from that address, because deleting it needs a level of access this
              website deliberately does not have.
            </p>
            <p className="mt-4">
              Deleting your account does not cancel a warranty. Cover runs from the invoice date and
              belongs to the unit, not to the account — but you would need your invoice and serial
              number again to make a claim.
            </p>

            <H2>Children</H2>
            <p>This site is not intended for anyone under 18.</p>

            <H2>Changes</H2>
            <p>
              We may update this policy. The date at the top of this page shows the version you are
              reading.
            </p>

            <H2>Contact</H2>
            <p>
              {COMPANY.legalName}
              <br />
              {COMPANY.registeredAddress}
              <br />
              Email: <Mail />
              <br />
              Support hours: {SUPPORT.hours}
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
