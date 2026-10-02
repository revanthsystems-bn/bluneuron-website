import { Inter_Tight } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import PageIntro from '@/components/PageIntro';
import ConsentNotice from '@/components/ConsentNotice';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';
import NotifyProvider from '@/components/notify/NotifyProvider';
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
    <html lang="en" className={`dark ${interTight.variable}`}>
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
      </body>
    </html>
  );
}
