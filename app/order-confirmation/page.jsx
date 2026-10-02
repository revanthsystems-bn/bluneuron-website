'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { formatPrice } from '@/lib/iriz';

const PAYMENT_LABELS = { upi: 'UPI', card: 'Card', cod: 'Cash on Delivery' };

export default function OrderConfirmationPage() {
  // undefined = still checking sessionStorage, null = nothing found there
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('bluneuron-last-order');
      setOrder(raw ? JSON.parse(raw) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) return null;

  if (!order) {
    return (
      <PageShell>
        <div className="section-container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold text-white">No recent order found.</p>
          <a href="/" className="btn-primary">
            Back to Home
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="border-b border-border-subtle bg-black py-16 text-center sm:py-20">
        <div className="section-container flex flex-col items-center">
          <CheckCircle2 size={56} className="mb-5 text-accent-soft" aria-hidden="true" />
          <p className="eyebrow mb-2">Pre-order Received</p>
          <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            You're reserved — we'll be in touch.
          </h1>
          <p className="mt-3 text-sm text-white/55">
            We'll contact you at {order.address?.phone || order.address?.email} to confirm and complete payment.
          </p>
          <p className="mt-3 text-sm text-white/55">Reservation #{order.orderNumber}</p>
        </div>
      </div>

      <div className="section-container grid gap-8 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
        <div className="glass-panel space-y-5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">What happens next</h2>
          <ul className="space-y-3 text-sm text-white/65">
            <li>• We'll call or email you at {order.address?.phone} / {order.address?.email} to confirm your reservation.</li>
            <li>• Payment is collected at that point — nothing has been charged yet.</li>
            <li>• Once confirmed, we'll email you the moment IRIZ ships, with tracking details.</li>
            <li>• Estimated delivery after confirmation: {order.deliveryEstimate}.</li>
            <li>• Preferred payment method: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}.</li>
          </ul>

          <div className="border-t border-border-subtle pt-5">
            <h3 className="mb-2 text-sm font-semibold text-white">Shipping to</h3>
            <p className="text-sm leading-relaxed text-white/60">
              {order.address?.name}
              <br />
              {order.address?.address}
              <br />
              {order.address?.city}, {order.address?.state} {order.address?.pincode}
              <br />
              {order.address?.phone}
            </p>
          </div>
        </div>

        <aside className="h-fit glass-panel space-y-5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>
          <div className="flex gap-4">
            <div className="product-glow relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={order.product.image}
                alt={order.product.name}
                fill
                sizes="80px"
                className="product-fade-tight object-contain p-2"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{order.product.name}</p>
              <p className="text-xs text-white/50">Qty {order.qty}</p>
              <p className="mt-1 text-sm font-bold text-white">{formatPrice(order.unitPrice)}</p>
            </div>
          </div>
          <dl className="space-y-2 border-t border-border-subtle pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Subtotal</dt>
              <dd className="text-white">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Shipping</dt>
              <dd className="text-accent-soft">{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold">
              <dt className="text-white">Total Due</dt>
              <dd className="text-white">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="section-container pb-16 text-center">
        <a href="/" className="btn-secondary inline-flex">
          Continue Shopping
        </a>
      </div>
    </PageShell>
  );
}
