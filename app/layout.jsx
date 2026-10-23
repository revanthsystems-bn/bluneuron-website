import { Suspense } from 'react';
import { Inter, Inter_Tight, Zen_Dots } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import PageIntro from '@/components/PageIntro';
import ConsentNotice from '@/components/ConsentNotice';
import { AccountProvider } from '@/components/account/AccountContext';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import NotifyProvider from '@/components/notify/NotifyProvider';
import BuyProvider from '@/components/buy/BuyProvider';
import MetaPixel from '@/components/MetaPixel';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_URL } from '@/lib/site';
import { ANIM_GATE } from '@/lib/anim-gate';
import { Analytics } from '@vercel/analytics/next';

/**
 * THE BODY FACE, AND IT WAS MISSING FOR THE WHOLE SITE UNTIL NOW.
 *
 * `--font-sans` in app/globals.css has always read `'Inter', system-ui, ...`
 * and nothing ever loaded Inter. Measured in the browser on the previous
 * commit: `document.fonts` held seven `Inter Tight` faces and two `Zen Dots`
 * ones and NO `Inter` face at all, and a canvas measurement of
 * "Handgloves 1080p WMW" at 40px came back 422.148px in `Inter` and the
 * identical 422.148px in a family that does not exist — against 450.996px in
 * Segoe UI. Identical to a bogus family is the proof: every visitor was
 * reading the browser's default, not Inter, and on Windows that default has a
 * deeper descender than Inter, which is why the "p" in a big "1080p" sat
 * outside its own line box (36px line box, 42px of ink).
 *
 * `variable` rather than `className`, so the existing `--font-sans` stack
 * picks it up and NOTHING else in the codebase has to change: every
 * `font-sans` utility, `.type-*` class and bare `font-family` inherits it
 * through that one custom property.
 *
 * WEIGHTS ARE LISTED EXPLICITLY — 400/500/600/700/800 — rather than taking
 * the variable axis. Those are the five the site actually sets (`font-medium`
 * through `font-extrabold`, plus `.stat-number`'s 800), and naming them keeps
 * the request to five static latin woff2 files instead of the full 100-900
 * axis. Inter's remaining weights are unused; a weight the site does not set
 * cannot render.
 *
 * `adjustFontFallback` is left at its default (true), which is what keeps
 * this from shifting the layout: next/font emits an `Inter Fallback`
 * @font-face with `size-adjust`, `ascent-override` and `descent-override`
 * computed from Inter's own metrics, so the system face shown during `swap`
 * occupies the same box as the real one. Do not add a `fallback: [...]`
 * array — it suppresses that face, exactly as the Zen Dots note below says.
 *
 * Self-hosted at build time: the woff2 files are emitted into
 * `/_next/static/media/` and the browser makes no request to Google. The CSP
 * in next.config.js already allows them — `font-src 'self' data:` — and no
 * header needed changing for this.
 */
const inter = Inter({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
  + 'and built-in Android 14 — your apps over Wi-Fi, with no streaming stick.';

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
    /*
     * `suppressHydrationWarning` on <html>, and ONLY here.
     *
     * The inline gate below adds `js-anim` to <html> before the body paints,
     * which is the whole point of it — so by the time React hydrates, the
     * element's className no longer matches the one the server rendered.
     * React logs that as a hydration mismatch ("1 Issue" in the dev
     * overlay). It is not a bug: the class is meant to be there, and nothing
     * in the tree reads it from React.
     *
     * The flag is scoped to this one element and suppresses the warning for
     * its attributes only — it does not reach any child, so a real mismatch
     * further down still reports.
     */
    <html
      lang="en"
      className={`dark ${inter.variable} ${interTight.variable} ${zenDots.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The scroll-reveal gate. The string lives in lib/anim-gate.js
            because next.config.js hashes it for the Content-Security-Policy
            and both ends must read the same bytes — see that file. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: ANIM_GATE }} />
      </head>
      <body className="bg-black font-sans text-white antialiased">
        <MotionConfig reducedMotion="user">
          {/* AccountProvider wraps CartProvider, not the other way round:
              Phase 2 syncs the basket to the signed-in account, so the cart
              needs to be able to read the session and never the reverse. */}
          <AccountProvider>
            <CartProvider>
              <NotifyProvider>
                {/* ONE "choose where to buy" sheet for the whole document.
                    Every Buy button on the site opens this instance rather
                    than mounting its own — a page carries up to four Buy
                    affordances, and four sheets would mean four focus traps
                    and four colliding `aria-labelledby` ids. It renders
                    nothing until opened. See components/buy/BuyProvider. */}
                <BuyProvider>
                <SmoothScroll />
                <PageIntro />
                {children}
                <ConsentNotice />
                <CartDrawer />
                </BuyProvider>
              </NotifyProvider>
            </CartProvider>
          </AccountProvider>
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
