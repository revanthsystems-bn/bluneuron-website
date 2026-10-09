/**
 * This layout exists ONLY to carry metadata.
 *
 * app/checkout/page.jsx is a client component ('use client' — it owns the form
 * state and the router push), and `metadata` exports are supported in server
 * components only. A route layout is a server component by default, so the
 * metadata lives one level up from the page that needs it. The layout renders
 * its children untouched and adds nothing to the DOM.
 *
 * `noindex`, because nothing here is a landing page: it is a step inside a
 * purchase flow, it has no content a searcher could want, and it is unreachable
 * while commerce is off (lib/launch.js). `follow` is kept so the links out of
 * it still pass through normally. It is also absent from app/sitemap.js, which
 * is the other half of the same statement.
 */
export const metadata = {
  title: 'Checkout — BluNeuron IRIZ',
  description: 'Complete your BluNeuron IRIZ order.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/checkout' },
};

export default function CheckoutLayout({ children }) {
  return children;
}
