import ProductList from '@/components/account/ProductList';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { ACCOUNTS_ENABLED } from '@/lib/site-config';

/*
 * ACCOUNTS ARE OFF (ACCOUNTS_ENABLED, lib/site-config), and the TITLE has to
 * say so too.
 *
 * The body of this route already renders the "Accounts, soon." panel — the
 * layout gates all five account routes before any of them render. The
 * metadata did not follow, so the browser tab, the bookmark, the share card
 * and any search result still read "My products & warranty": a promise of a feature that does
 * not exist, in the one place a visitor sees before the page itself.
 *
 * The live wording is kept beside it rather than deleted, so turning the
 * flag on is still a one-line change here and not an archaeology exercise.
 */
export const metadata = {
  ...pageMetadata({
    title: ACCOUNTS_ENABLED ? 'My products & warranty — BluNeuron' : 'Accounts coming soon — BluNeuron',
    description: ACCOUNTS_ENABLED
      ? 'Units registered to your BluNeuron account, and their warranty status.'
      : 'BluNeuron accounts are not open yet. Warranty registration and claims need no account.',
    path: ROUTES.accountProducts,
  }),
  robots: routeRobots(ROUTES.accountProducts),
};

export default function AccountProductsPage() {
  return <ProductList />;
}
