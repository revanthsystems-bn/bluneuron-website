import { Suspense } from 'react';
import { Inter_Tight, Zen_Dots } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import PageIntro from '@/components/PageIntro';
import ConsentNotice from '@/components/ConsentNotice';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import NotifyProvider from '@/components/notify/NotifyProvider';
import MetaPixel from '@/components/MetaPixel';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_URL } from '@/lib/site';
import { Analytics } from '@vercel/analytics/next';

/**
 * The hero display face. Inter Tight rather than the `--font-sans` stack.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
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
  + 'and built-in Google TV with 10,000+ apps.';

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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${interTight.variable} ${zenDots.variable}`}>
      <body className="bg-black font-sans text-white antialiased">
        <MotionConfig reducedMotion="user">
          <CartProvider>
            <NotifyProvider>
              <SmoothScroll />
              <PageIntro />
              {children}
              <ConsentNotice />
              <CartDrawer />
            </NotifyProvider>
          </CartProvider>
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
