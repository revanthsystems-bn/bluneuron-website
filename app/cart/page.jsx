import { redirect } from 'next/navigation';
import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import CartPanel from '@/components/cart/CartPanel';
import { ROUTES, routeRobots } from '@/lib/routes';
import { CART_ENABLED } from '@/lib/site-config';
import { pageMetadata } from '@/lib/seo';

/**
 * /cart — the basket, and the handover to a marketplace.
 *
 * NOINDEX (via routeRobots → PRIVATE_ROUTES in lib/routes.js) and absent
 * from the sitemap. A cart is per-visitor state; indexed, it would be
 * whatever a crawler happened to find, which is always an empty one.
 *
 * The page itself is a SERVER component and the basket inside it is the
 * client leaf — the Next.js rule this codebase follows everywhere, so the
 * metadata, the shell and the chrome ship no JavaScript.
 */

export const metadata = {
  ...pageMetadata({
    title: 'Your cart — BluNeuron',
    description: 'Your BluNeuron cart, and checkout on Amazon or Flipkart.',
    path: ROUTES.cart,
  }),
  robots: routeRobots(ROUTES.cart),
};

export default function CartPage() {
  /*
   * The basket is switched off (CART_ENABLED, lib/site-config) while
   * buying happens on Amazon and Flipkart. Someone still reaches this URL
   * from an old bookmark or by typing it, and the product page is what
   * they actually want — so this redirects rather than 404s.
   *
   * A 307, which is what `redirect()` issues from a server component: the
   * cart is coming back, and a 308 would be cached by browsers and proxies
   * long after the flag flips.
   */
  if (!CART_ENABLED) redirect(ROUTES.product);

  return (
    <PageShell>
      <PageHeading
        eyebrow="Cart"
        title="Your cart."
        subtitle="Choose a quantity here, then check out on Amazon or Flipkart — whichever you prefer."
      />

      <section className="bg-black section-y">
        <div className="section-container">
          <CartPanel />
        </div>
      </section>
    </PageShell>
  );
}
