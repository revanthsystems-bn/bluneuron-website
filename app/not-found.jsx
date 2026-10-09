import PageShell from '@/components/PageShell';
import Reveal from '@/components/Reveal';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Page Not Found — BluNeuron',
};

/**
 * The 404.
 *
 * `app/not-found.jsx` at the root catches every unmatched URL in the app, not
 * just `notFound()` calls — so this is the page for a mistyped address, a link
 * from an old invoice, and a route that has been renamed. Next injects
 * `<meta name="robots" content="noindex">` on a 404 itself, so there is none
 * here.
 *
 * It renders inside PageShell, which means it keeps the masthead and the full
 * four-column footer. That is the whole point: the most likely visitor is
 * someone who already owns an IRIZ and followed a stale support link, and the
 * footer they land on is a complete map of the site. A bare "404" page with a
 * single "go home" button would make them start their search over.
 *
 * The four links below are the destinations people actually arrive looking
 * for, not a sitemap dump — the product, where to buy it, support, and the
 * warranty.
 */
const DESTINATIONS = [
  { href: ROUTES.home, label: 'IRIZ overview', body: 'The product, the specs, and what it does.' },
  {
    href: ROUTES.whereToBuy,
    label: 'Where to buy',
    body: 'Our Amazon and Flipkart listings, and what each handles.',
  },
  {
    href: ROUTES.support,
    label: 'Support',
    body: 'Warranty, claims, FAQ, manuals and contact.',
  },
  {
    href: ROUTES.warranty,
    label: 'Warranty policy',
    body: 'What is covered, for how long, and how to claim.',
  },
];

export default function NotFound() {
  return (
    <PageShell>
      <section className="bg-black py-24 sm:py-32">
        <div className="section-container">
          <Reveal className="max-w-xl">
            <p className="eyebrow mb-4">404</p>
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
              That page isn&apos;t here.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              The link may be out of date, or the address may have a typo in it. Nothing is broken
              on your end — here is where most people are heading.
            </p>
          </Reveal>

          <div className="bento-grid mt-12">
            {DESTINATIONS.map((item, i) => (
              <Reveal
                key={item.href}
                delay={Math.min(i, 3) * 0.05}
                y={20}
                className="bento-tile lg:col-span-6"
              >
                <a
                  href={item.href}
                  className="flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <h2 className="text-base font-semibold text-white">{item.label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                  <span className="mt-auto pt-5 text-sm font-medium text-white/70" aria-hidden="true">
                    →
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
