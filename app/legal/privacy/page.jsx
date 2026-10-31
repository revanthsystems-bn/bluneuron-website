import { Inbox, BarChart3, Megaphone, Table2, Database, Target } from 'lucide-react';
import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import PolicyToc from '@/components/legal/PolicyToc';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  ACCOUNTS_ENABLED,
  COMPANY,
  SUPPORT,
  sellersAnd,
  sellersOr,
  sellersVerb,
} from '@/lib/site-config';
import { CLUB } from '@/lib/club';

/**
 * The privacy policy — the only legal page that does not go through
 * components/LegalPage.
 *
 * LegalPage takes `sections` of plain strings and lists. This page needs
 * markup that shape cannot express: bold lead-ins inside list items,
 * paragraphs that follow a list inside one section, service cards, and mailto
 * and external links. So the prose is written out here, in the same chrome
 * (PageShell + PageHeading), the same two-column layout and the same
 * PolicyToc as every other policy page.
 *
 * WHAT CHANGED when the support hub landed: this policy described a site
 * whose only form was a launch-list signup asking for an email and an
 * optional phone number. There are now three more forms — warranty
 * registration, warranty claim and contact — collecting a name, a mobile
 * number, a marketplace, an invoice number, a purchase date and an optional
 * serial number.
 * A privacy policy that does not mention the data the site's main forms
 * collect is not a disclosure, so the "What we collect" section is written
 * per form, naming the fields.
 *
 * ---------------------------------------------------------------------------
 * TWO ACCURACY FIXES, both of them a policy that had stopped describing the
 * site:
 *
 *   1. THE LAUNCH LIST IS GONE. SHOW_BUY is true, so every purchase-intent
 *      surface renders a Buy link and components/NotifyButton — the only
 *      thing that opened the signup modal — is never rendered. Checked
 *      against the served HTML of /, /shop, /shop/iriz, /where-to-buy and
 *      /support: zero matches. A policy that discloses the collection of
 *      data no form on the site can collect is not a disclosure, it is
 *      noise, and it is the kind of noise that makes a reader doubt the
 *      rest. Removed from "What we collect", from "How we use it" and from
 *      "How long we keep it".
 *
 *   2. "THE SITE ITSELF HAS NO DATABASE AND STORES NOTHING" WAS FALSE. It
 *      was true when Web3Forms delivered everything to an inbox and nothing
 *      else existed. Warranty registrations and claims are now written to a
 *      Google Sheet the support team works from, which the Services section
 *      below already described further down the same page — so the policy
 *      contradicted itself within two screens. The Web3Forms entry now says
 *      what Web3Forms does and stops there; where the records live is the
 *      Google Sheet entry's job.
 *
 * Neither is a rewording for tone. Both are a statement about personal data
 * that did not match what the site does.
 * ---------------------------------------------------------------------------
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
 * for accounts, for where a warranty registration is stored, and now for the
 * two accuracy fixes above — and a "last updated" that moves on documents
 * whose text did not change is the one line on a policy page a reader uses to
 * decide whether to re-read it.
 *
 * ---------------------------------------------------------------------------
 * 24 OCTOBER 2026: THE IRIZ CLUB.
 * ---------------------------------------------------------------------------
 * A third store of personal data now exists — `club_members` in Supabase,
 * holding a first name, an email, an optional phone and city, the serial used
 * to join, and a consent timestamp. It is declared in four sections above:
 * what we collect, how we use it, how long we keep it, and your choices.
 *
 * IT IS NOT JOINED TO THE WARRANTY RECORDS, and the policy says so, because
 * a customer asking us to "delete my data" is asking about one of three
 * things. The inventory of all three is in the header of
 * lib/warranty-registration.js; adding a fourth means editing both.
 *
 * The analytics paragraph under "How we use it" is new and is a commitment,
 * not a description: no name, email, phone, invoice number or serial reaches
 * GA4, GOOGLE ADS or the Meta Pixel, in an event, a URL or a page title. The
 * Club's pages carry no identifier at all — membership is a signed cookie,
 * never a query string — so there is nothing for a Referer header to leak
 * either.
 *
 * GOOGLE ADS, added 31 October 2026, is the newest entry and the one whose
 * disclosure needed the most care, because what it CAN do and what it IS
 * doing differ. It rides on the single Google tag already loaded for GA4 (one
 * gtag.js, two `config` calls — see components/GoogleAnalytics), and ad
 * personalisation, cross-device signals and enhanced conversions are all
 * switched off for it explicitly in lib/googleAds.js. The bullet names
 * remarketing anyway, and then says it is off: a reader deciding whether to
 * care about a Google advertising cookie should not have to infer the
 * capability from its absence. If any of those three flags is ever turned on,
 * THAT BULLET IS WRONG and this page has to change in the same commit.
 */
const PRIVACY_LAST_UPDATED = '31 October 2026';

/**
 * The contents list, and the only place section headings are written.
 *
 * `H2` below reads its id and its text from this array, so the rail can never
 * advertise a section the page does not render and a heading cannot be
 * retitled in one place and not the other — the failure mode of every
 * hand-maintained table of contents.
 */
const SECTIONS = [
  { id: 'what-we-collect', heading: 'What we collect' },
  { id: 'how-we-use-it', heading: 'How we use it' },
  { id: 'services-we-use', heading: 'Services we use' },
  { id: 'how-long-we-keep-it', heading: 'How long we keep it' },
  { id: 'your-choices', heading: 'Your choices' },
  { id: 'children', heading: 'Children' },
  { id: 'changes', heading: 'Changes' },
  { id: 'contact', heading: 'Contact' },
];

const sectionById = Object.fromEntries(SECTIONS.map((s) => [s.id, s.heading]));

export const metadata = pageMetadata({
  title: 'Privacy Policy — BluNeuron',
  description:
    'What BluNeuron collects on bluneuron.com — the warranty, claim and contact forms, and the analytics services we use — and how to have it deleted.',
  path: ROUTES.privacy,
});

/**
 * Section heading. `scroll-mt-24` is what makes the contents links usable:
 * the masthead is fixed, so an un-offset anchor jump puts the heading
 * underneath it and the reader lands on the wrong line.
 */
function H2({ id }) {
  return (
    <h2
      id={id}
      className="mb-3 mt-10 scroll-mt-24 text-xl font-semibold tracking-tight text-white first:mt-0"
    >
      {sectionById[id]}
    </h2>
  );
}

function Mail({ address = CONTACT_EMAIL }) {
  return (
    <a
      href={`mailto:${address}`}
      className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
    >
      {address}
    </a>
  );
}

function Ext({ href, children }) {
  return (
    <a
      href={href}
      className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

/**
 * The four things most people open a privacy policy to check.
 *
 * Every one is answered in full further down; this is a summary and says so.
 * It is NOT a substitute for the policy and must never state something the
 * sections below do not — a key-points box that softens the document under it
 * is worse than no box, because it is the part people actually read.
 */
const KEY_POINTS = [
  {
    title: 'We do not sell your data',
    body: 'Not to anyone, for any purpose.',
  },
  {
    title: 'We do not take your payment details',
    body: `Buying an IRIZ happens on ${sellersOr()}. We never see your card, your UPI ID or your delivery address.`,
  },
  {
    title: 'We collect only what a form asks for',
    body: 'A warranty claim needs the invoice number, and the serial number when the unit has one printed on it. It does not need your address, and the form does not ask for one.',
  },
  {
    title: 'You can have it deleted',
    body: 'Email us with the serial number and we will remove the record.',
  },
];

/**
 * The services, as cards rather than a bulleted list.
 *
 * Each card names the one job that service does for us. The full disclosure —
 * what is sent, what is not, where it is held, and how to opt out — stays in
 * the prose under the card, because a card is a label and a privacy
 * disclosure is a sentence.
 *
 * SUPABASE IS BEHIND ACCOUNTS_ENABLED. Accounts are off, so no sign-in code
 * is sent, no profile is stored and no address is saved — and a policy that
 * tells a reader we hold account data when we hold none is as wrong as one
 * that hides data we do hold. The entry returns with the feature.
 */
const SERVICES = [
  {
    icon: Inbox,
    name: 'Web3Forms',
    role: 'Delivers the forms on this site to our inbox',
  },
  {
    icon: BarChart3,
    name: 'Google Analytics 4',
    role: 'Counts visits and which pages people use',
  },
  {
    icon: Target,
    name: 'Google Ads',
    role: 'Measures our Google ads — remarketing signals are switched off',
  },
  {
    icon: Megaphone,
    name: 'Meta Pixel',
    role: 'Measures our Facebook and Instagram ads',
  },
  {
    icon: Table2,
    name: 'Google Sheets',
    role: 'Holds the warranty records our support team works from',
  },
  ...(ACCOUNTS_ENABLED
    ? [{ icon: Database, name: 'Supabase', role: 'Stores your account, and sends the sign-in code' }]
    : []),
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last updated: ${PRIVACY_LAST_UPDATED}`}
      />

      <section className="bg-black py-14 sm:py-18">
        <div className="section-container">
          {/*
            TWO COLUMNS AT lg, ONE BELOW IT — the same grid components/LegalPage
            uses, so this page and the other four policies read as one set.

            `lg:grid-cols-[232px_minmax(0,680px)]` rather than fractions: the
            prose measure is the thing being protected, so it is stated as a
            real maximum and the contents rail takes a fixed width beside it.

            `items-start` so the sticky rail has somewhere to stick — a
            stretched grid item is full-height and `position: sticky` has no
            room to move inside it.
          */}
          <div className="grid gap-10 lg:grid-cols-[232px_minmax(0,680px)] lg:items-start lg:gap-14">
            <PolicyToc items={SECTIONS} />

            <div className="min-w-0 max-w-[680px] text-base leading-relaxed text-white/70">
              {/* KEY POINTS. Above the policy, not instead of it — the last
                  line says so and links into the sections that carry the
                  detail. */}
              <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-7">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-soft">
                  Key points
                </h2>
                <ul className="mt-5 space-y-4">
                  {KEY_POINTS.map((point) => (
                    <li key={point.title} className="flex gap-3">
                      <span
                        className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-soft"
                        aria-hidden="true"
                      />
                      <p className="text-[15px] leading-relaxed text-white/70">
                        <strong className="font-semibold text-white">{point.title}.</strong>{' '}
                        {point.body}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/45">
                  A summary, not a substitute — the sections below are the policy.
                </p>
              </div>

              <p>
                {COMPANY.brandName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a brand of{' '}
                {COMPANY.legalName}, which makes the IRIZ projector. This policy explains what
                information we collect on bluneuron.com, what we do with it, and how to have it
                removed.
              </p>
              <p className="mt-4">
                We do not sell on this website. Buying an IRIZ happens on {sellersOr()}, and
                the personal data in that transaction — your address, your payment details, your
                invoice — is collected and held by the marketplace under their privacy policy, not
                ours. We never see your card details, and we are not given your delivery address.
              </p>

              <H2 id="what-we-collect" />
              <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
                <li>
                  <strong className="font-semibold text-white">
                    Warranty registration and warranty claims:
                  </strong>{' '}
                  your name, email address and mobile number, which marketplace you bought from,
                  your invoice number, the purchase date, the unit&rsquo;s serial number where it has
                  one, and — on a claim
                  — your description of what is going wrong.
                </li>
                <li>
                  <strong className="font-semibold text-white">Contact form:</strong> your name,
                  your email address, and your message.
                </li>
                <li>
                  <strong className="font-semibold text-white">The {CLUB.name}:</strong> your first
                  name, your email address, the serial number of the unit you joined with, and your
                  phone number and city if you choose to give them — both are optional and the form
                  says so. We also record that you ticked the consent box, and when.
                </li>
                {ACCOUNTS_ENABLED && (
                  <li>
                    <strong className="font-semibold text-white">If you create an account:</strong>{' '}
                    your email address (which is also how you sign in), and your name and mobile
                    number if you add them. If you save an address for a service pickup, we hold
                    that too. Units you register are kept with their marketplace, invoice number, purchase
                    date and serial number, along with any warranty claim you raise and its status.
                  </li>
                )}
                <li>
                  <strong className="font-semibold text-white">When you register a product:</strong>{' '}
                  the details above are written to the Google Sheet our support team works from, so
                  they can answer a claim against them
                  {ACCOUNTS_ENABLED
                    ? ', and — if you are signed in — to your own account, so the unit and its warranty end date appear under My products & warranty. One registration creates one record in each; it is not stored twice over.'
                    : '.'}
                </li>
                <li>
                  <strong className="font-semibold text-white">When you visit the site:</strong>{' '}
                  basic information about the visit, such as pages viewed, device and browser type,
                  approximate location (country or city), and how you arrived — for example, from an
                  ad.
                </li>
              </ul>
              <p className="mt-4">
                Give us only what a form asks for. A warranty claim needs the serial number and the
                invoice number to be assessed; it does not need your address, and the form does not ask
                for one.
              </p>
              <p className="mt-4">
                We do not collect payment details at any point: the purchase happens on{' '}
                {sellersOr()}, and we are not given your card, your UPI ID or your delivery address.
                {ACCOUNTS_ENABLED
                  ? ' We never ask for a password either. Signing in sends a six-digit code to your email address and that is the whole of it — there is no password for us to store or for anyone to steal.'
                  : ''}
              </p>

              <H2 id="how-we-use-it" />
              <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
                <li>To answer your message, and to reply to you about a support request.</li>
                <li>
                  To register a unit&rsquo;s warranty, to assess a claim against it, and to arrange
                  the repair or replacement that follows.
                </li>
                {ACCOUNTS_ENABLED && (
                  <li>
                    To keep your account: to sign you in, to show you the units you have registered
                    and when their warranty ends, and to pre-fill a claim so you do not retype what
                    we already hold.
                  </li>
                )}
                <li>
                  To run the {CLUB.name}: to confirm the serial number you entered is one of ours
                  and has not already been used, to recognise you when you sign in on another
                  device, and to contact you about the Club — which is what the consent box on the
                  join form is for.
                </li>
                <li>To understand how people use the site and improve it.</li>
                <li>To measure and improve our advertising on Facebook and Instagram.</li>
                <li>To measure and improve our advertising on Google.</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information, and that includes everything above — the
                {' '}{CLUB.name} list is not shared with anyone outside BluNeuron.
              </p>
              <p className="mt-4">
                Nothing you give us is sent to Google Analytics, to Google Ads or to the Meta
                Pixel. Your name, your email address, your phone number, your invoice number and
                your serial number are not included in any analytics or advertising event, in any
                page address or in any page title, anywhere on this
                site — including inside the {CLUB.name}, where the pages carry no identifier at all
                and your membership is held in a signed cookie rather than in the URL.
              </p>

              <H2 id="services-we-use" />

              {/* The cards are the index; the prose under them is the
                  disclosure. Two columns from sm — five short cards in one
                  column is a list with borders round it. */}
              <ul className="mb-8 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                {SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <li key={service.name} className="h-full">
                      <div className="flex h-full gap-3.5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <Icon
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-soft"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{service.name}</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                            {service.role}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
                <li>
                  <strong className="font-semibold text-white">Web3Forms:</strong> delivers the
                  forms on this site — the warranty forms and the contact form — to our inbox. The
                  details you type pass through them in transit and arrive with us.
                </li>
                <li>
                  <strong className="font-semibold text-white">Google Analytics 4:</strong> counts
                  visits and measures which pages people use. It uses cookies. Google&rsquo;s
                  advertising and cross-device features are switched off for this site, so the data
                  is not used to personalise ads or linked to a Google account, and we never send
                  your name, email address, phone number, invoice number or serial number to it. Google
                  processes this data under its own privacy policy. You can opt out across all sites
                  with Google&rsquo;s browser add-on at{' '}
                  <Ext href="https://tools.google.com/dlpage/gaoptout">
                    tools.google.com/dlpage/gaoptout
                  </Ext>
                  .
                </li>
                <li>
                  <strong className="font-semibold text-white">Google Ads:</strong> advertising
                  measurement. It uses cookies to measure which of our Google ads led to a visit
                  and to a click through to a marketplace listing. It shares the single Google tag
                  this site already loads for Google Analytics &mdash; there is no second script.
                  It is also the tool Google would use for remarketing &mdash; showing our ads to
                  you again on other sites &mdash; and ad personalisation and cross-device signals
                  are switched off for it, so it does not build those audiences and the data is not
                  linked to a Google account. Enhanced conversions are off: we never send your
                  name, email address, phone number, invoice number or serial number to it, hashed
                  or otherwise. Google processes this data under its own privacy policy. You can
                  turn off personalised Google ads at{' '}
                  <Ext href="https://myadcenter.google.com/">myadcenter.google.com</Ext> and opt out
                  of measurement across all sites with Google&rsquo;s browser add-on at{' '}
                  <Ext href="https://tools.google.com/dlpage/gaoptout">
                    tools.google.com/dlpage/gaoptout
                  </Ext>
                  .
                </li>
                <li>
                  <strong className="font-semibold text-white">
                    Meta Pixel (Facebook/Instagram):
                  </strong>{' '}
                  uses cookies to measure visits and clicks through to a marketplace listing from
                  our ads. It is sent the fact that one of those happened and nothing about you: no
                  name, no email address, no phone number, no order details. Meta processes this
                  data under its own privacy policy. You can limit ad tracking in your browser
                  settings or in your Facebook/Instagram ad settings.
                </li>
                <li>
                  <strong className="font-semibold text-white">Google Workspace and Sheets:</strong>{' '}
                  hosts our support inbox and the Google Sheet our support team works from. Warranty
                  registrations and claims are written to that sheet — your name, email address,
                  mobile number, where you bought the unit, your invoice number, the purchase date and the
                  serial number. Access to it is limited to named members of the BluNeuron team; it
                  is not shared by link and is not public. Google processes this under its own
                  privacy policy and does not use it for anything of its own.
                </li>
                {ACCOUNTS_ENABLED && (
                  <li>
                    <strong className="font-semibold text-white">Supabase:</strong> stores your
                    account — your sign-in, your profile, your saved addresses, your registered
                    units and your claims — and sends the six-digit sign-in code. They process this
                    on our behalf and do not use it for anything of their own. The database is
                    hosted in their Mumbai (ap-south-1) region, so your account data stays in India.
                    Access is enforced row-by-row in the database itself: a signed-in person can
                    read and change their own rows and nobody else&rsquo;s.
                  </li>
                )}
                <li>
                  <strong className="font-semibold text-white">Vercel Analytics:</strong> counts
                  visits without using cookies. It runs only on a copy of this site hosted by Vercel
                  — the live site at www.bluneuron.com does not load it.
                </li>
              </ul>
              <p className="mt-4">
                {sellersAnd()} {sellersVerb('sets its', 'set their')} own cookies on{' '}
                {sellersVerb('its', 'their')} own site. Clicking through to a listing takes you
                there, and from that point their privacy policy applies.
              </p>

              <H2 id="how-long-we-keep-it" />
              <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
                <li>
                  <strong className="font-semibold text-white">
                    Warranty registrations, and claim records:
                  </strong>{' '}
                  for the length of the warranty and a reasonable period after it, because a later
                  claim is assessed against them. The support team&rsquo;s record is removed on
                  request — email <Mail /> with the serial number.
                </li>
                <li>
                  <strong className="font-semibold text-white">Support and contact messages:</strong>{' '}
                  for as long as needed to resolve the matter and handle any follow-up.
                </li>
                <li>
                  <strong className="font-semibold text-white">{CLUB.name} membership:</strong> for
                  as long as you are a member. Ask us to leave and we delete your name, email,
                  phone and city; the serial number is released so the unit could be registered
                  again by a future owner. Email <Mail /> from the address you joined with, or with
                  your serial number, and say you want to leave the Club.
                </li>
                {ACCOUNTS_ENABLED && (
                  <li>
                    <strong className="font-semibold text-white">Account data:</strong> for as long
                    as you keep the account. Delete it from your account settings and your profile,
                    addresses, registered units and claim history are removed immediately. Deleting
                    your account removes your copy of a registration; the support team&rsquo;s
                    record is removed on request, as above.
                  </li>
                )}
              </ul>

              <H2 id="your-choices" />
              <p className="mb-4">
                Leaving the {CLUB.name} is a single email to <Mail />, and it does not affect your
                warranty: the two are separate records, and deleting your membership does not
                delete a warranty registration or a claim. Say which you mean, or say both.
              </p>
              <p>
                You can ask us to show you, correct or delete the information we hold about you at
                any time by emailing <Mail />. Deleting a warranty registration is your decision to
                make and your record to lose — we cannot assess a later claim from a record that is
                gone, so we will say so before acting on the request.
              </p>
              {ACCOUNTS_ENABLED && (
                <>
                  <p className="mt-4">
                    If you have an account you can do most of this yourself, without asking: edit
                    your profile, add and remove addresses, and use{' '}
                    <strong className="font-semibold text-white">Delete my account and data</strong>{' '}
                    in your account settings to erase your profile, addresses, registered units and
                    claims. Your sign-in record — your email address, nothing else — is removed by
                    us when you email <Mail /> from that address, because deleting it needs a level
                    of access this website deliberately does not have.
                  </p>
                  <p className="mt-4">
                    Deleting your account does not cancel a warranty. Cover runs from the invoice
                    date and belongs to the unit, not to the account — but you would need your
                    invoice and serial number again to make a claim.
                  </p>
                </>
              )}

              <H2 id="children" />
              <p>This site is not intended for anyone under 18.</p>

              <H2 id="changes" />
              <p>
                We may update this policy. The date at the top of this page shows the version you
                are reading.
              </p>

              <H2 id="contact" />
              <p>
                {COMPANY.legalName}
                <br />
                {COMPANY.registeredAddress}
                <br />
                Email: <Mail />
                <br />
                Support hours: {SUPPORT.hours}
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
