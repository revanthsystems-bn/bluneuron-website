import { DEMO_ORDERS } from '@/lib/account-demo';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'My orders — BluNeuron',
    description: 'Purchases registered to your BluNeuron account.',
    path: ROUTES.accountOrders,
  }),
  robots: routeRobots(ROUTES.accountOrders),
};

/**
 * My orders — and the honest caveat that makes this page possible.
 *
 * WE CANNOT READ YOUR MARKETPLACE ORDERS. There is no API that hands a
 * seller a buyer's Amazon or Flipkart order list, so this page cannot be a
 * feed. What it can be is the purchases the customer told us about when they
 * registered a unit, with a link out to the marketplace where the real order
 * — its invoice, its delivery status, its return window — actually lives.
 *
 * That limitation is stated at the top of the page rather than buried, for
 * the same reason it is stated in the warranty policy: a customer who
 * expects tracking here and does not find it concludes the site is broken,
 * not that the data was never ours to show.
 *
 * "Track on Amazon/Flipkart" therefore links to the marketplace's ORDERS
 * page, not to a tracking URL for a specific order — we do not have the
 * order's identifier in any form their site would accept from us.
 */
const MARKETPLACE_ORDER_PAGES = {
  Amazon: 'https://www.amazon.in/gp/css/order-history',
  Flipkart: 'https://www.flipkart.com/rv/orders',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountOrdersPage() {
  const orders = DEMO_ORDERS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          My orders
        </h2>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/45">
          These are the purchases you registered with us. Your invoice, delivery status and return
          window live with the marketplace that took the order — we are not given access to them.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-border-subtle bg-black-soft px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-white">Nothing registered yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            Register a purchase and it will appear here with its warranty status.
          </p>
          <a href={ROUTES.warrantyRegistration} className="btn-primary mt-7 justify-center">
            Register a purchase
          </a>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white">{order.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {order.marketplace} · {formatDate(order.purchaseDate)}
                  </p>
                  <p className="mt-3 break-all font-mono text-xs text-white/60">{order.orderId}</p>
                </div>

                <a
                  href={MARKETPLACE_ORDER_PAGES[order.marketplace]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary shrink-0 px-5 py-2 text-xs"
                >
                  Track on {order.marketplace}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
