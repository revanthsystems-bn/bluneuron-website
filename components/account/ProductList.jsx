'use client';

import Image from 'next/image';
import { useAccountRecords } from './useAccountRecords';
import { ROUTES } from '@/lib/routes';
import { WARRANTY } from '@/lib/site-config';

/**
 * My products & warranty — the page the account exists for.
 *
 * THE WARRANTY END DATE IS NOT COMPUTED HERE. It is a generated column in
 * Postgres (`purchase_date + 1 year`), so the row, this page and
 * /legal/warranty cannot disagree about how long cover runs. A date derived
 * in the client is a date that drifts the day the policy changes.
 *
 * THE STATUS PILL states cover, not sentiment: "Active" or "Expired" and a
 * date. No green ticks, no "you're covered!" — the only thing a customer
 * needs from this screen is whether a claim will be accepted and until when.
 *
 * ACTIVE/EXPIRED IS DERIVED FROM THE DATE, not read from the stored status.
 * A stored status is correct on the day it is written and wrong every day
 * after; nothing runs nightly to age these rows, and nothing should have to.
 *
 * THE CLAIM LINK PRE-FILLS. Linking to the bare claim form would make someone
 * retype the order ID and serial number this page is already showing them,
 * which is the entire reason to register a unit.
 */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Cover is live until the end of the warranty day, not from its midnight. */
function isActive(product) {
  if (!product.warrantyEnds) return false;
  return new Date(product.warrantyEnds).getTime() >= Date.now() - 86400000;
}

/**
 * The claim form, pre-filled from the unit. Query parameters rather than
 * client state so the link survives being opened in a new tab, copied, or
 * followed after a sign-out and back in.
 */
export function claimHref(product) {
  const params = new URLSearchParams({
    serial: product.serialNumber ?? '',
    order: product.orderId ?? '',
    marketplace: product.marketplace ?? '',
    purchased: product.purchaseDate ?? '',
  });
  return `${ROUTES.warrantyClaim}?${params.toString()}`;
}

export default function ProductList() {
  const { products, claims, loading } = useAccountRecords();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-step-2 font-semibold uppercase tracking-[0.18em] text-ink-2">
            My products &amp; warranty
          </h2>
          <p className="mt-2 max-w-prose text-step-1 leading-relaxed text-ink-3">
            Registering a unit records its serial number and purchase date against your account, so
            a claim does not depend on finding the invoice again.
          </p>
        </div>
        <a href={ROUTES.warrantyRegistration} className="btn-secondary px-5 py-2 text-step-1">
          Register a unit
        </a>
      </div>

      {loading ? (
        <p className="text-step-2 text-ink-3">Loading…</p>
      ) : products.length === 0 ? (
        <div className="rounded-card border border-border-subtle bg-black-soft px-6 section-y text-center">
          <h3 className="text-step-3 font-semibold text-white">No units registered yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-step-2 leading-relaxed text-ink-3">
            Register your IRIZ with its order ID and serial number and its warranty status will
            show here.
          </p>
          <a href={ROUTES.warrantyRegistration} className="btn-primary mt-7 justify-center">
            Register a unit
          </a>
        </div>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => {
            const active = isActive(product);
            return (
              <li
                key={product.id}
                className="rounded-card border border-border-subtle bg-black-soft p-6 sm:p-7"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-ctl border border-border-subtle bg-black">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="160px"
                      className="product-fade-tight object-contain p-1.5"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-step-3 font-semibold text-white">{product.name}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-step-0 font-semibold uppercase tracking-wide ${
                          active
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                            : 'border-white/15 bg-white/5 text-ink-3'
                        }`}
                      >
                        {active ? 'In warranty' : 'Warranty expired'}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-x-8 gap-y-3 text-step-2 sm:grid-cols-2">
                      <Row label="Bought from" value={product.marketplace} />
                      <Row label="Order ID" value={product.orderId} mono />
                      <Row label="Serial number" value={product.serialNumber} mono />
                      <Row label="Purchased" value={formatDate(product.purchaseDate)} />
                      <Row
                        label={`Warranty (${WARRANTY.label})`}
                        value={`${active ? 'Until' : 'Expired'} ${formatDate(product.warrantyEnds)}`}
                      />
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href={claimHref(product)} className="btn-secondary px-5 py-2 text-step-1">
                        Raise a claim
                      </a>
                      <a
                        href={ROUTES.warranty}
                        className="px-2 py-2 text-step-1 text-ink-3 underline underline-offset-2 transition-colors hover:text-ink-2"
                      >
                        What is covered
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-card border border-border-subtle bg-black-soft p-6 sm:p-7">
        <h3 className="text-step-2 font-semibold uppercase tracking-[0.18em] text-ink-2">Claims</h3>
        {claims.length === 0 ? (
          <p className="mt-4 text-step-2 leading-relaxed text-ink-3">
            No claims raised. If something goes wrong with a registered unit, a claim from here
            arrives with its serial number and purchase date already attached.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border-subtle">
            {claims.map((claim) => (
              <li key={claim.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-step-2 text-ink-2">{claim.issue}</p>
                  <p className="mt-1 text-step-1 text-ink-3">{formatDate(claim.createdAt)}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-step-0 font-semibold uppercase tracking-wide text-ink-3">
                  {claim.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-step-0 font-semibold uppercase tracking-[0.16em] text-ink-3">
        {label}
      </dt>
      {/* `break-all` on the identifiers: an Amazon order ID is a single
          unbroken 23-character token and will push a 390px card into
          horizontal scroll without it. */}
      <dd className={`mt-1 text-ink-2 ${mono ? 'break-all font-mono text-step-1' : 'text-step-2'}`}>
        {value || '—'}
      </dd>
    </div>
  );
}
