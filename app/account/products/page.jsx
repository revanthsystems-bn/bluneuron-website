import Image from 'next/image';
import { DEMO_CLAIMS, DEMO_PRODUCTS } from '@/lib/account-demo';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { WARRANTY } from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'My products & warranty — BluNeuron',
    description: 'Units registered to your BluNeuron account, and their warranty status.',
    path: ROUTES.accountProducts,
  }),
  robots: routeRobots(ROUTES.accountProducts),
};

/**
 * My products & warranty — the page the account exists for.
 *
 * THE WARRANTY END DATE IS DERIVED, never stored as a separate truth:
 * purchase date + WARRANTY.months (lib/account-demo.js computes it from the
 * same constant /legal/warranty quotes). A stored end date is a number that
 * can disagree with the policy; a derived one cannot.
 *
 * THE STATUS PILL states cover, not sentiment. "Active" and a date, or
 * "Expired" and a date — no green ticks, no "you're covered!", because the
 * only thing a customer needs from this screen is whether a claim will be
 * accepted and until when.
 *
 * THE CLAIM BUTTON PRE-FILLS. Linking to the bare claim form would make
 * someone re-type the order ID and serial number this page is already
 * showing them, which is the whole reason to register a unit. Phase 2 passes
 * the unit through to /support/warranty-claim.
 */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountProductsPage() {
  const products = DEMO_PRODUCTS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            My products &amp; warranty
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/45">
            Registering a unit records its serial number and purchase date against your account, so
            a claim does not depend on finding the invoice again.
          </p>
        </div>
        <a href={ROUTES.warrantyRegistration} className="btn-secondary px-5 py-2 text-xs">
          Register a unit
        </a>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-border-subtle bg-black-soft px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-white">No units registered yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            Register your IRIZ with its order ID and serial number and its warranty status will
            show here.
          </p>
          <a href={ROUTES.warrantyRegistration} className="btn-primary mt-7 justify-center">
            Register a unit
          </a>
        </div>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-7"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-black">
                  <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-white">{product.name}</h3>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      {product.status}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <Row label="Bought from" value={product.marketplace} />
                    <Row label="Order ID" value={product.orderId} mono />
                    <Row label="Serial number" value={product.serialNumber} mono />
                    <Row label="Purchased" value={formatDate(product.purchaseDate)} />
                    <Row
                      label={`Warranty (${WARRANTY.label})`}
                      value={`Until ${formatDate(product.warrantyEnds)}`}
                    />
                  </dl>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={ROUTES.warrantyClaim} className="btn-secondary px-5 py-2 text-xs">
                      Raise a claim
                    </a>
                    <a href={ROUTES.warranty} className="px-2 py-2 text-xs text-white/45 underline underline-offset-2 transition-colors hover:text-white/70">
                      What is covered
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Claims
        </h3>
        {DEMO_CLAIMS.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            No claims raised. If something goes wrong with a registered unit, a claim from here
            arrives with its serial number and purchase date already attached.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </dt>
      {/* `break-all` on the identifiers: an Amazon order ID is a single
          unbroken 23-character token and will push a 390px card into
          horizontal scroll without it. */}
      <dd className={`mt-1 text-white/75 ${mono ? 'break-all font-mono text-xs' : 'text-sm'}`}>
        {value}
      </dd>
    </div>
  );
}
