/**
 * Metadata-only layout — same reasoning as app/checkout/layout.jsx: the page
 * itself is a client component and cannot export `metadata`.
 *
 * `noindex`, because this page shows one visitor's own order details and is
 * reachable only by completing a checkout. `follow` is kept so its outbound
 * links behave normally. Also absent from app/sitemap.js.
 */
export const metadata = {
  title: 'Order Confirmed — BluNeuron IRIZ',
  description: 'Your BluNeuron IRIZ order has been confirmed.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/order-confirmation' },
};

export default function OrderConfirmationLayout({ children }) {
  return children;
}
