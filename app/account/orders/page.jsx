import OrderList from '@/components/account/OrderList';
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
 * and any search result still read "My orders": a promise of a feature that does
 * not exist, in the one place a visitor sees before the page itself.
 *
 * The live wording is kept beside it rather than deleted, so turning the
 * flag on is still a one-line change here and not an archaeology exercise.
 */
export const metadata = {
  ...pageMetadata({
    title: ACCOUNTS_ENABLED ? 'My orders — BluNeuron' : 'Accounts coming soon — BluNeuron',
    description: ACCOUNTS_ENABLED
      ? 'Purchases registered to your BluNeuron account.'
      : 'BluNeuron accounts are not open yet. Warranty registration and claims need no account.',
    path: ROUTES.accountOrders,
  }),
  robots: routeRobots(ROUTES.accountOrders),
};

export default function AccountOrdersPage() {
  return <OrderList />;
}
