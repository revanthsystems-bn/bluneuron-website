import { BRAND, MEDIA } from './iriz';
import { WARRANTY } from './site-config';

/**
 * DEMO MODE — the account area with no backend behind it.
 *
 * WHY IT EXISTS. The account area is four pages of layout that only make
 * sense with data in them: an empty profile, an empty address book and an
 * empty product list all look identical and none of them can be reviewed.
 * So when there is no Supabase project configured, the pages render against
 * the fixtures below instead of refusing to render at all.
 *
 * THE RULE THIS IS BUILT AROUND: demo data must be impossible to mistake for
 * real data. Every page that reads these fixtures also renders
 * components/account/DemoNotice at the top, the order IDs are visibly fake,
 * and the whole area is `noindex` (PRIVATE_ROUTES in lib/routes.js) so none
 * of it can reach a search result. The one thing that must never happen is a
 * person seeing a plausible order they did not place.
 *
 * HOW IT TURNS OFF. `DEMO_MODE` is true while the Supabase URL and anon key
 * are absent from the environment. Configure them and every consumer reads
 * the real session instead, with no edit here — this file is then dead code
 * on a production build and can be deleted.
 *
 * DEMO_MODE itself is decided in lib/supabase/config.js — "are there keys?"
 * is a question about the backend, not about the fixtures, and it is read by
 * the auth layer too. It is re-exported here only so a page rendering demo
 * data can import both from one place.
 */
export { DEMO_MODE } from './supabase/config';

/** The identity a demo sign-in lands on. */
export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.invalid',
  phone: '',
};

/**
 * `.invalid` and `.example` are RESERVED (RFC 2606 / RFC 6761) and can never
 * be registered, so nothing here can collide with a real person's address or
 * a real listing. That is deliberate — a demo fixture using a plausible
 * gmail.com address is a demo fixture that eventually emails a stranger.
 */
export const DEMO_ADDRESSES = [
  {
    id: 'demo-addr-1',
    label: 'Home',
    isDefault: true,
    name: 'Demo User',
    line1: '12 Example Street',
    line2: 'Demo Layout',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641004',
    phone: '+91 00000 00000',
  },
  {
    id: 'demo-addr-2',
    label: 'Work',
    isDefault: false,
    name: 'Demo User',
    line1: '4th Floor, Example Tower',
    line2: 'Sample Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    phone: '+91 00000 00000',
  },
];

/**
 * A registered unit, and the one computed field that matters: the warranty
 * end date is purchase + WARRANTY.months, derived rather than stored, so the
 * demo cannot disagree with the policy page about how long cover runs.
 */
function addMonths(iso, months) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PRODUCTS = [
  {
    id: 'demo-prod-1',
    name: BRAND.fullName,
    image: MEDIA.product.heroClean,
    marketplace: 'Amazon',
    orderId: 'DEMO-000-0000000-0000000',
    serialNumber: 'DEMOSERIAL0001',
    purchaseDate: '2026-08-02',
    get warrantyEnds() {
      return addMonths(this.purchaseDate, WARRANTY.months);
    },
    status: 'Active',
  },
];

/**
 * "My orders" is the registered products, not a marketplace order feed.
 *
 * We cannot read anyone's Amazon or Flipkart account — there is no API that
 * gives a seller a buyer's order list — so this page can only ever show what
 * the customer told us when they registered the unit, plus a link out to the
 * marketplace where the real order lives. Anything more would be invented.
 */
export const DEMO_ORDERS = DEMO_PRODUCTS;

/** No claims raised yet is the normal state, and the empty state has to show it. */
export const DEMO_CLAIMS = [];
