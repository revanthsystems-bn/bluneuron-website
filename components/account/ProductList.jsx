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
 * retype the invoice number and serial number this page is already showing them,
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
    // `invoice`, not `order` - renamed with the field. SupportForm still
    // reads the old name as a fallback, so a link already sitting in
    // somebody's history or inbox keeps working.
    invoice: product.orderId ?? '',
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
            My products &amp; warranty
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/55">
            Registering a unit records its serial number and purchase date against your account, so
            a claim does not depend on finding the invoice again.
          </p>
        </div>
        <a href={ROUTES.warrantyRegistration} className="btn-secondary px-5 py-2 text-xs">
          Register a unit
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-white/55">Loading…</p>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-border-subtle bg-black-soft px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-white">No units registered yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            Register your IRIZ with its invoice number and its warranty status will
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
                className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-7"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-black">
                    <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-white">{product.name}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          active
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                            : 'border-white/15 bg-white/5 text-white/50'
                        }`}
                      >
                        {active ? 'In warranty' : 'Warranty expired'}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                      <Row label="Bought from" value={product.marketplace} />
                      <Row label="Invoice number" value={product.orderId} mono />
                      <Row label="Serial number" value={product.serialNumber} mono />
                      <Row label="Purchased" value={formatDate(product.purchaseDate)} />
                      <Row
                        label={`Warranty (${WARRANTY.label})`}
                        value={`${active ? 'Until' : 'Expired'} ${formatDate(product.warrantyEnds)}`}
                      />
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href={claimHref(product)} className="btn-secondary px-5 py-2 text-xs">
                        Raise a claim
                      </a>
                      <a
                        href={ROUTES.warranty}
                        className="px-2 py-2 text-xs text-white/55 underline underline-offset-2 transition-colors hover:text-white/70"
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

      <section className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Claims</h3>
        {claims.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            No claims raised. If something goes wrong with a registered unit, a claim from here
            arrives with its serial number and purchase date already attached.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border-subtle">
            {claims.map((claim) => (
              <li key={claim.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">{claim.issue}</p>
                  <p className="mt-1 text-xs text-white/55">{formatDate(claim.createdAt)}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
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
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
        {label}
      </dt>
      {/* `break-all` on the identifiers: an Amazon invoice number is a single
          unbroken 23-character token and will push a 390px card into
          horizontal scroll without it. */}
      <dd className={`mt-1 text-white/75 ${mono ? 'break-all font-mono text-xs' : 'text-sm'}`}>
        {value || '—'}
      </dd>
    </div>
  );
}
