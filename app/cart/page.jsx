import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import CartPanel from '@/components/cart/CartPanel';
import { redirect } from 'next/navigation';
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
   * THE BASKET IS OFF (CART_ENABLED, lib/site-config), so this route sends
   * people to the product page.
   *
   * A redirect rather than a 404 or a "cart is empty" panel: with the cart
   * switched off nothing can ever put an item in it, so an empty-cart screen
   * would be permanently, confusingly true. Anyone landing here typed the URL
   * or kept a bookmark, and what they want is the thing they were going to
   * buy — which is one page away and has a working Buy button on it.
   */
  if (!CART_ENABLED) redirect(ROUTES.product);

  return (
    <PageShell>
      <PageHeading
        eyebrow="Cart"
        title="Your cart."
        subtitle="Choose a quantity here, then check out on Amazon or Flipkart — whichever you prefer."
      />

      <section className="bg-black py-14 sm:py-20">
        <div className="section-container">
          <CartPanel />
        </div>
      </section>
    </PageShell>
  );
}
