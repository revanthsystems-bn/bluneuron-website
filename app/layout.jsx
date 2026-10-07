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
import { SITE_URL } from '@/lib/site';
import { Analytics } from '@vercel/analytics/next';

/**
 * The hero display face. Inter Tight rather than the `--font-sans` stack:
 * the stack names Inter but nothing in this project ever loaded it, so on
 * most machines the display type was falling through to system-ui. This is
 * the only webfont on the site — one variable file, latin subset, self-hosted
 * by next/font (no request to Google at runtime) — and it is scoped to
 * `.type-display` alone, so body copy still costs nothing. Revert by deleting
 * the font-family line in app/globals.css.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

/**
 * The IRIZ wordmark face. Zen Dots is a display-only geometric face used for
 * exactly one string on the site — the hero wordmark — so it is NOT applied to
 * anything inheritable: it is exposed as `--font-iriz` and reached only
 * through the `.font-iriz` utility in app/globals.css.
 *
 * ONE WEIGHT. Zen Dots ships 400 and nothing else (see the family entry in
 * next/dist/compiled/@next/font/dist/google/font-data.json), so there is no
 * bold to fall back on — `.font-iriz` pins font-weight to 400 rather than
 * letting `.type-display`'s 700 synthesise a smeared faux-bold.
 *
 * `adjustFontFallback` is next/font/google's default; it is named here
 * because it is the thing that keeps the swap from moving the layout. Next
 * emits a `Zen Dots Fallback` @font-face — `src: local(Arial)` with
 * `size-adjust: 140.2%`, `ascent-override: 66.34%`,
 * `descent-override: 19.26%` — so the face the visitor sees during the swap
 * occupies the same box as Zen Dots itself and `display: 'swap'` costs no CLS.
 *
 * NO `fallback: [...]` HERE, deliberately, and this is not a style choice:
 * passing one SUPPRESSES that generated face. With
 * `fallback: ['system-ui', 'arial']` the build emitted
 * `--font-iriz: "Zen Dots", system-ui, arial` and no `Zen Dots Fallback`
 * @font-face at all — i.e. exactly the layout shift `adjustFontFallback` is
 * there to prevent. Without it: `--font-iriz: "Zen Dots", "Zen Dots Fallback"`.
 * Verified in the built CSS both ways. The plain-system end of the chain is
 * appended in `.font-iriz` (app/globals.css) instead, where it costs nothing.
 *
 * Self-hosted at build time like Inter Tight above — the woff2 is emitted into
 * the build output, so no visitor ever requests fonts.googleapis.com.
 */
const zenDots = Zen_Dots({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-iriz',
  display: 'swap',
  adjustFontFallback: true,
});

const TITLE = 'BluNeuron IRIZ — True 500 ANSI Lumens, Built-in Google TV';
const DESCRIPTION =
  'The BluNeuron IRIZ projector: true 500 ANSI Lumens, native 1080P, Allwinner H723 chipset, and built-in Google TV with 10,000+ apps.';
const OG_IMAGE = '/media/iriz/product/hero-clean.png';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s' },
  description: DESCRIPTION,
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
    images: [{ url: OG_IMAGE, width: 1600, height: 1600, alt: 'BluNeuron IRIZ projector' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
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
        <Analytics />
        {/* Meta Pixel base code + PageView on every route change.
            The Suspense boundary is required, not cosmetic: MetaPixel reads
            `useSearchParams`, and a root-layout client component that does
            that without a boundary pulls the entire page tree out of
            prerendering. Wrapped, the pages stay static and only this
            (render-nothing) component is client-rendered. */}
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
      </body>
    </html>
  );
}
