import Image from 'next/image';
import { MapPin, Package, ShieldCheck, Store, Mail } from 'lucide-react';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, SUPPORT, WARRANTY, allKnown, sellersAnd } from '@/lib/site-config';
import { BRAND, MEDIA } from '@/lib/iriz';

export const metadata = {
  ...pageMetadata({
    title: 'About BluNeuron — Honest Projector Specs',
    description:
      'Why BluNeuron exists, and why the IRIZ mini projector for home is built on honest ANSI brightness claims and real native 1080p, not marketing numbers.',
    path: ROUTES.about,
  }),
  robots: routeRobots(ROUTES.about),
};

/**
 * The four facts, each read from the file that owns it rather than typed.
 *
 *   one product          BRAND.model, and the "Stand behind one product"
 *                        value below says the same thing in a sentence.
 *   the cover period     WARRANTY from lib/site-config.js — the single source
 *                        /legal/warranty, both warranty forms and the
 *                        registration success screen all quote. A warranty
 *                        whose length differs between two pages of the same
 *                        site is not a document anyone can rely on, and this
 *                        would have been a fifth surface to get wrong.
 *   where to buy         the same pair the announcement bar and
 *                        /where-to-buy name; the company section below
 *                        already says we sell through them rather than our
 *                        own store.
 *   the support address  SUPPORT.email from lib/site-config.js.
 *
 * Nothing here is new. It is the four things someone lands on this page
 * wanting to confirm, lifted out of three sections of prose they would
 * otherwise have to read to find them.
 */
const FACTS = [
  { icon: Package, value: `1 product`, label: `The ${BRAND.model}, and nothing else` },
  // `WARRANTY.label`, NOT `${WARRANTY.months} months`. This tile read
  // "12 months" while /shop/iriz, /shop and /legal/warranty all read
  // "1 year" — the same cover period in two vocabularies, on four pages of
  // one site. `label` is the English form and is what prose uses, everywhere.
  { icon: ShieldCheck, value: WARRANTY.label, label: 'Warranty from the invoice date' },
  { icon: Store, value: sellersAnd(), label: 'Where the IRIZ is sold' },
  { icon: Mail, value: SUPPORT.email, label: 'Support, answered by us', href: `mailto:${SUPPORT.email}` },
];

const VALUES = [
  {
    title: 'Measure honestly',
    body: 'The projector industry is full of "LED lumens" numbers measured at the bulb, before any optical loss. We rate the IRIZ in true ANSI lumens — the standardized, independently measurable metric — because the number on the box should be the number on your wall.',
  },
  {
    title: 'Cut what doesn’t matter, keep what does',
    body: 'A built-in smart OS, 4-point auto keystone, and real audio aren’t upsells to us — they’re what makes a projector usable the day it arrives. We’d rather ship those than a marketing spec that reads bigger on paper.',
  },
  {
    title: 'Stand behind one product',
    body: 'BluNeuron isn’t a catalog of a hundred SKUs. We build one projector at a time, get it right, and support the people who bought it.',
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About BluNeuron"
        title="A projector brand built around one honest number."
        subtitle="We started BluNeuron because the home-projector market is full of inflated brightness claims — and we wanted to build the projector we couldn't find."
        image={MEDIA.product.withBox}
        imageAlt=""
        imagePosition="50% 50%"
      />

      {/* ----------------------------------------------------------------- *
       * THE PLACE, AND THE FOUR FACTS.
       *
       * Coimbatore comes from COMPANY.registeredAddress — the same string the
       * footer prints and the company section below reads. It is not a second
       * claim typed in beside it.
       *
       * The four tiles are an index, not new information: every one is a fact
       * the page already states further down, pulled up to where someone who
       * came here to check one of them will actually find it.
       * ----------------------------------------------------------------- */}
      <section className="border-b border-border-subtle bg-black py-10 sm:py-12">
        <div className="section-container">
          {allKnown(COMPANY.registeredAddress) && (
            <Reveal className="flex items-center gap-2.5 text-sm text-white/60">
              <MapPin className="h-4 w-4 shrink-0 text-accent-soft" aria-hidden="true" />
              <span>
                Designed in <span className="font-semibold text-white/85">Coimbatore, India</span>
              </span>
            </Reveal>
          )}

          {/* Two columns on a phone, four from sm. `items-stretch` plus
              `h-full` so the tiles share a height whatever their label does —
              the email is the long one and wraps on a narrow screen. */}
          <ul className="mt-8 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4">
            {FACTS.map((fact, i) => {
              const Icon = fact.icon;
              const value = fact.href ? (
                <a
                  href={fact.href}
                  className="underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
                >
                  {fact.value}
                </a>
              ) : (
                fact.value
              );
              return (
                <Reveal
                  key={fact.label}
                  as="li"
                  y={20}
                  delay={Math.min(i, 3) * 0.05}
                  className="h-full"
                >
                  <div className="bento-tile flex h-full flex-col p-5">
                    <Icon className="mb-4 h-[18px] w-[18px] text-accent-soft" aria-hidden="true" />
                    {/* `break-words`, because the support address is one long
                        token and a 156px tile on a 375px phone cannot hold it
                        otherwise — it would push the grid wider than the
                        page. */}
                    <p className="text-base font-semibold leading-tight text-white break-words">
                      {value}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{fact.label}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container max-w-2xl">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tighter text-white">Why IRIZ</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Most budget projectors advertise brightness numbers that don't survive contact with a real room —
              inflated "LED lumens" figures that collapse the moment you turn a lamp on. The IRIZ is our answer:
              a projector rated in true ANSI lumens, with a built-in smart OS so you're not stuck buying a
              separate streaming stick, and the auto-keystone correction that should have been
              standard on budget projectors years ago. It's the projector we wanted to buy and couldn't find, so
              we built it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">What We Care About</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Our approach</h2>
          </Reveal>

          <div className="bento-grid">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06} y={20} className={`bento-tile p-6 lg:col-span-4 ${
                  i === VALUES.length - 1 ? 'sm:col-span-2 lg:col-span-4' : ''
                }`}>
                <h3 className="mb-2 text-base font-semibold text-white">{v.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/*
        The registered entity, in prose rather than as the footer's compact
        disclosure line. Both read COMPANY from lib/site-config.js and both
        hide while it is unknown — a "who we are" page that answers the
        question with "[TBD]" is worse than one that does not raise it. The
        difference is only in the telling: the footer is the legally required
        disclosure on every page, this is the paragraph someone looking into
        the company actually wants to read.
      */}
      {allKnown(COMPANY.legalName, COMPANY.registeredAddress) && (
        <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
          <div className="section-container">
            <Reveal className="max-w-[680px]">
              <h2 className="text-2xl font-bold tracking-tighter text-white">The company</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                {COMPANY.brandName} is a brand of{' '}
                <span className="font-semibold text-white/85">{COMPANY.legalName}</span>, registered
                in India at {COMPANY.registeredAddress}
                {allKnown(COMPANY.gstin) && <> under GSTIN {COMPANY.gstin}</>}.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                We sell through {sellersAnd()} rather than running our own store, so every
                order, payment and delivery is handled there —{' '}
                <a
                  href={ROUTES.whereToBuy}
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  where to buy
                </a>{' '}
                sets out who handles what after an order.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- *
       * RESERVED: THE TEAM / OFFICE PHOTOGRAPH.
       *
       * Deliberately a placeholder and deliberately visible as one. A page
       * about who we are wants a picture of the people, and we do not have
       * one — so this marks the slot, states what belongs in it, and renders
       * nothing that pretends to be it. A stock photograph of an office that
       * is not ours would be a lie told in pictures, which is the one thing
       * a page arguing for honest measurement cannot do.
       *
       * TO FILL IT: drop the file in public/media/company/, add it to MEDIA
       * in lib/iriz.js, and replace this block with the <Image>. Give it real
       * alt text — it is carrying information, not decoration. Then delete
       * this comment.
       * ----------------------------------------------------------------- */}
      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center sm:min-h-[280px]">
            <p className="text-sm font-semibold text-white/70">
              Photograph of the team and the Coimbatore office goes here
            </p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/50">
              Left empty on purpose. We would rather show nothing than a stock
              photograph of an office that is not ours.
            </p>
          </Reveal>
        </div>
      </section>

      {/* THE CONTACT BLOCK, with both addresses in it.

          It used to be one line and a button to /support/contact, which is
          the right destination for someone with a broken unit and the wrong
          one for a distributor, a retailer or a journalist — they read an
          ABOUT page, and the button they were offered led to a support form.
          So the two addresses are stated here: support for the product, sales
          for everything commercial. Both read SUPPORT from lib/site-config.js
          and are the same addresses /support/contact publishes.

          Service hours beside them, because an address with no answer time is
          half a promise — and this is the only place on the page that offers
          to be contacted at all. */}
      <section className="bg-black py-16 text-center sm:py-20">
        <div className="section-container">
          <Reveal>
            <p className="mx-auto max-w-md text-sm text-white/50">
              Questions about the company or the product? We&apos;d genuinely like to hear from you.
            </p>

            <dl className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-10">
              <div>
                {/* `text-white/55`, not /45. White at 45% over black measures 4.43:1,
                    just under the 4.5:1 WCAG AA asks of 12px text — axe-core
                    flags it, and it is the same token /support/contact uses
                    for this label. */}
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Support
                </dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-white">
                  <a
                    href={`mailto:${SUPPORT.email}`}
                    className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                  >
                    {SUPPORT.email}
                  </a>
                </dd>
              </div>
              <div>
                {/* `text-white/55`, not /45. White at 45% over black measures 4.43:1,
                    just under the 4.5:1 WCAG AA asks of 12px text — axe-core
                    flags it, and it is the same token /support/contact uses
                    for this label. */}
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Sales &amp; partnerships
                </dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-white">
                  <a
                    href={`mailto:${SUPPORT.salesEmail}`}
                    className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                  >
                    {SUPPORT.salesEmail}
                  </a>
                </dd>
              </div>
            </dl>

            <p className="mx-auto mt-5 max-w-md text-xs text-white/55">{SUPPORT.hours}</p>

            <a href={ROUTES.contact} className="btn-secondary mt-7 inline-flex">
              Get in Touch →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
