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
