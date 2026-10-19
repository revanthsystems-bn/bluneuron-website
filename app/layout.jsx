import { Suspense } from 'react';
import { Inter_Tight, Zen_Dots } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import dynamic from 'next/dynamic';
import SmoothScroll from '@/components/SmoothScroll';
import ConsentNotice from '@/components/ConsentNotice';
import { CartProvider } from '@/components/cart/CartContext';
import NotifyProvider from '@/components/notify/NotifyProvider';
import BuyProvider from '@/components/buy/BuyProvider';
import MetaPixel from '@/components/MetaPixel';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { CART_ENABLED } from '@/lib/site-config';
import { SITE_URL } from '@/lib/site';
import { Analytics } from '@vercel/analytics/next';

/**
 * THE site face — body copy and headings both.
 *
 * It used to be loaded only as `--font-display` for the hero, while
 * `--font-sans` named 'Inter' (no relation) which was never loaded at all.
 * Every paragraph on the site therefore rendered in whatever `system-ui`
 * resolved to on the visitor's machine: Segoe UI on Windows, SF on macOS,
 * Roboto on Android — three different sites.
 *
 * One family now covers both roles. `--font-display` is kept as an alias
 * rather than deleted because `.type-display` and the hero wordmark's
 * fallback chain both name it, and a display role that can diverge later is
 * worth preserving even while it points at the same family.
 *
 * Weights are explicit: 300 carries `.type-lede`, 700 the display sizes.
 * Left to default, next/font ships 400 only and both render synthesised.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
});

/**
 * Zen Dots wordmark font for 'iriz'.
 * Self-hosted at build time with adjustFontFallback to prevent CLS.
 *
 * Do not add a `fallback: [...]` array — it suppresses the generated
 * 'Zen Dots Fallback' @font-face and reintroduces layout shift on the hero
 * wordmark. Zen Dots ships weight 400 only.
 */
const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-iriz',
  display: 'swap',
  adjustFontFallback: true,
});

/**
 * Site-wide metadata DEFAULTS. Every real route overrides title, description,
 * canonical and Open Graph through `pageMetadata` (lib/seo.js) — these values
 * are the fallback for a route that forgets to, not the homepage's copy. The
 * homepage sets its own in app/page.jsx.
 *
 * NOTE: no `alternates` key here, and that is deliberate. Metadata merges
 * shallowly from layout to page, so a canonical set in this file would be
 * inherited by every page that didn't set its own — pointing all of them at a
 * single URL. lib/seo.js has the full reasoning.
 */
const TITLE = 'BluNeuron IRIZ — Mini Projector for Home';
const DESCRIPTION =
  'The BluNeuron IRIZ mini projector for home: native 1080p, true 500 ANSI lumens, '
  + 'and built-in Android 14 with 10,000+ apps.';

export const metadata = {
  // Resolves every root-relative URL in this file and in `pageMetadata` —
  // canonicals, og:url, og:image — to an absolute one. Relative URLs in
  // metadata are a build error without it.
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s' },
  description: DESCRIPTION,
  applicationName: 'BluNeuron',
  icons: {
    icon: '/brand/logo-mark.png',
    shortcut: '/brand/logo-mark.png',
    apple: '/brand/logo-mark.png',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'BluNeuron',
    images: [
      {
        url: '/media/iriz/product/hero-clean.png',
        width: 1600,
        height: 1600,
        alt: 'The BluNeuron IRIZ mini projector for home, three-quarter view, lens forward',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/media/iriz/product/hero-clean.png'],
  },
};

/**
 * AccountProvider, or nothing at all.
 *
 * `next/dynamic` RATHER THAN A PLAIN IMPORT, and that is the entire point.
 * A static `import { AccountProvider }` puts the module — and @supabase
 * behind it — in this layout's bundle whether or not the branch below ever
 * renders it: an `if` at runtime does not remove an import at build time, and
 * the chunk was still being preloaded on the homepage after the gate was
 * added. A dynamic import makes it its own chunk, requested only when
 * something actually renders it.
 *
 * No `ssr: false`: this is a server component, and the account area must
 * still server-render normally when the flag is on.
 */
const AccountProvider = dynamic(() =>
  import('@/components/account/AccountContext').then((m) => m.AccountProvider)
);

/**
 * The cart slide-over, deferred for the same reason.
 *
 * It already returned null while CART_ENABLED is false (lib/site-config), but
 * a static import still shipped its markup, framer-motion and two lucide
 * icons to every page for a drawer that currently cannot be opened at all.
 *
 * No `ssr: false`: this is a Server Component and Next rejects that option
 * here. The mount below is gated on the same flag instead, so with the cart
 * off the import never runs and the chunk is never requested — which is the
 * outcome `ssr: false` would have bought anyway.
 */
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'));

function MaybeAccountProvider({ children }) {
  if (!ACCOUNTS_ENABLED) return children;
  return <AccountProvider>{children}</AccountProvider>;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${interTight.variable} ${zenDots.variable}`}>
      <body className="bg-black font-sans text-white antialiased">
        <MotionConfig reducedMotion="user">
          {/* ACCOUNTS ARE OFF, so the Supabase client is never downloaded.
              components/account/AccountProviderGate has the full note,
              including the two obvious fixes that did not work. It still
              wraps CartProvider when it IS mounted, not the other way round:
              syncing the basket to a signed-in account means the cart has to
              be able to read the session and never the reverse. */}
          <>
            <CartProvider>
              <NotifyProvider>
                {/* One "choose where to buy" sheet for the whole document.
                    Every Buy button on the site opens this one instance
                    rather than mounting its own — a page has up to four
                    Buy affordances, and four modals would mean four focus
                    traps and four colliding label ids. It renders nothing
                    until opened. See components/buy/BuyProvider. */}
                <BuyProvider>
                  <SmoothScroll />
                  {/* PAGE INTRO REMOVED — it was costing the thing it was
                      decorating.

                      It painted a full-viewport black overlay with the logo
                      mark, for 1.1s plus a 0.5s fade. The overlay was mounted
                      from a `useEffect`, so it appeared only AFTER hydration:
                      on a cold load the page painted, and then a black sheet
                      dropped over content the visitor could already see and
                      held it for 1.6 seconds. Measured on this build, that is
                      most of the homepage's 4.5s LCP render delay.

                      A load curtain has to be the first paint or it is not a
                      load curtain. Doing that properly means blocking render
                      on it, which is the same cost paid deliberately instead
                      of accidentally. The hero's own CSS entrance
                      (`.hero-rise`, app/globals.css) is the arrival animation
                      now, and it starts with the first frame. */}
                  {children}
                  <ConsentNotice />
                  {CART_ENABLED && <CartDrawer />}
                </BuyProvider>
              </NotifyProvider>
            </CartProvider>
          </>
        </MotionConfig>
        {/* VERCEL-ONLY. @vercel/analytics reports to the Vercel dashboard of
            the deployment serving the page; there is no dashboard behind it
            anywhere else, so on GoDaddy Node.js hosting it would load a
            script that can never report. `VERCEL` is set by Vercel itself on
            every build and runtime, and nowhere else — so this is read, not
            configured, and needs no env var of our own.

            Evaluated on the server at build time (this layout is static), so
            the non-Vercel build does not ship the script at all rather than
            loading it and having it no-op. Google Analytics below is the
            host-independent replacement and runs in both places. */}
        {process.env.VERCEL ? <Analytics /> : null}
        {/* Meta Pixel base code + PageView on every route change, and the GA4
            tag + page_view on every route change.
            The Suspense boundary is required, not cosmetic: both components
            read `useSearchParams`, and a root-layout client component that
            does that without a boundary pulls the entire page tree out of
            prerendering. Wrapped, the pages stay static and only these
            (render-nothing) components are client-rendered. One boundary is
            enough for both. */}
        <Suspense fallback={null}>
          <MetaPixel />
          <GoogleAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
