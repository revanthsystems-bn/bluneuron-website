import { DEMO_ADDRESSES } from '@/lib/account-demo';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Saved addresses — BluNeuron',
    description: 'Addresses saved to your BluNeuron account.',
    path: ROUTES.accountAddresses,
  }),
  robots: routeRobots(ROUTES.accountAddresses),
};

/**
 * Saved addresses.
 *
 * WHY A BRAND SITE HOLDS ADDRESSES AT ALL, given it takes no orders: a
 * warranty claim ends with a unit being collected or returned, and that
 * needs somewhere to send it. The copy says so, because an address book on
 * a site that cannot deliver anything otherwise looks like data collected
 * for its own sake — which, under DPDP, is what purpose limitation forbids.
 *
 * ONE DEFAULT, marked. The default is the address a claim form pre-fills, so
 * it has to be visible at a glance rather than implied by position.
 */
export default function AccountAddressesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            Saved addresses
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/45">
            Used to arrange a service pickup or return when you raise a warranty claim. Your
            marketplace delivery address stays with Amazon or Flipkart — we are not given it.
          </p>
        </div>
        <button type="button" disabled className="btn-secondary cursor-not-allowed px-5 py-2 text-xs opacity-45">
          Add address
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DEMO_ADDRESSES.map((address) => (
          <li
            key={address.id}
            className="rounded-3xl border border-border-subtle bg-black-soft p-6"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">{address.label}</h3>
              {address.isDefault && (
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                  Default
                </span>
              )}
            </div>

            <address className="mt-4 text-sm not-italic leading-relaxed text-white/60">
              {address.name}
              <br />
              {address.line1}
              <br />
              {address.line2 && (
                <>
                  {address.line2}
                  <br />
                </>
              )}
              {address.city}, {address.state} {address.pincode}
              <br />
              {address.phone}
            </address>

            <div className="mt-5 flex gap-4 text-xs">
              <button type="button" disabled className="cursor-not-allowed text-white/30">
                Edit
              </button>
              <button type="button" disabled className="cursor-not-allowed text-white/30">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
