'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PageShell from '@/components/PageShell';
import Magnetic from '@/components/Magnetic';
import { useCart } from '@/components/cart/CartContext';
import { formatPrice, PRICING } from '@/lib/iriz';
import { PURCHASE_MODE } from '@/lib/commerce';
import { submitCheckoutOrder } from '@/lib/web3forms';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

const SHIPPING_FLAT = 0; // free shipping
const DELIVERY_ESTIMATE = '3–5 business days';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Pay via any UPI app' },
  { id: 'card', label: 'Card', hint: 'Credit or Debit card' },
  { id: 'cod', label: 'Cash on Delivery', hint: 'Pay when it arrives' },
];

const initialAddress = { name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' };

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BN-${rand}`;
}

function Field({ label, id, error, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-white/50">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        className="w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft"
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { product, qty, subtotal, hydrated, clear } = useCart();
  const [fields, setFields] = useState(initialAddress);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const total = subtotal + SHIPPING_FLAT;

  function validate() {
    const next = {};
    if (!fields.name.trim()) next.name = 'Enter your full name.';
    if (!/^[6-9]\d{9}$/.test(fields.phone.trim())) next.phone = 'Enter a valid 10-digit mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(fields.email.trim())) next.email = 'Enter a valid email address.';
    if (!fields.address.trim()) next.address = 'Enter your address.';
    if (!fields.city.trim()) next.city = 'Enter your city.';
    if (!fields.state) next.state = 'Select your state.';
    if (!/^\d{6}$/.test(fields.pincode.trim())) next.pincode = 'Enter a valid 6-digit pincode.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (qty === 0 || submitting) return;
    if (!validate()) return;

    if (PURCHASE_MODE === 'razorpay') {
      // TODO: real Razorpay integration seam. PURCHASE_MODE is read from
      // lib/commerce.js — once the backend order-creation route exists,
      // replace this block with something like:
      //
      // const order = await fetch('/api/razorpay/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: total * 100, currency: 'INR' }),
      // }).then((r) => r.json());
      //
      // const script = document.createElement('script');
      // script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      // document.body.appendChild(script);
      // script.onload = () => {
      //   const rzp = new window.Razorpay({
      //     key: RAZORPAY_KEY_ID,
      //     amount: order.amount,
      //     currency: order.currency,
      //     order_id: order.id,
      //     name: 'BluNeuron',
      //     description: 'BluNeuron IRIZ Projector',
      //     prefill: { name: fields.name, email: fields.email, contact: fields.phone },
      //     theme: { color: '#3B82F6' },
      //     handler: (response) => {
      //       // verify response.razorpay_payment_id / order_id / signature
      //       // server-side, then persist the order and redirect to
      //       // /order-confirmation.
      //     },
      //   });
      //   rzp.open();
      // };
      //
      // Until that's built, fall through to the dummy flow below so the UI
      // stays fully testable end to end.
      console.warn('[commerce] PURCHASE_MODE is "razorpay" but the integration isn\'t wired up yet — using the dummy flow.');
    }

    setSubmitting(true);
    setSubmitError('');
    const order = {
      orderNumber: generateOrderNumber(),
      placedAt: new Date().toISOString(),
      product: { name: product.name, image: product.image },
      qty,
      unitPrice: PRICING.offerPrice,
      mrp: PRICING.mrp,
      subtotal,
      shipping: SHIPPING_FLAT,
      total,
      deliveryEstimate: DELIVERY_ESTIMATE,
      paymentMethod,
      address: { ...fields },
    };

    // No backend exists yet, so this Web3Forms submission IS the order — the
    // sessionStorage copy below never leaves the customer's browser. If this
    // fails, the reservation is lost, so we surface the error instead of
    // silently continuing to the confirmation page.
    try {
      await submitCheckoutOrder(order);
    } catch (err) {
      setSubmitting(false);
      setSubmitError(
        err.message || 'Could not send your reservation. Please try again, or reach us directly.'
      );
      return;
    }

    try {
      window.sessionStorage.setItem('bluneuron-last-order', JSON.stringify(order));
    } catch {
      // sessionStorage unavailable — the confirmation page falls back to its "no order" state.
    }
    clear();
    router.push('/order-confirmation');
  }

  if (hydrated && qty === 0 && !submitting) {
    return (
      <PageShell>
        <div className="section-container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold text-white">Your cart is empty.</p>
          <a href="/" className="btn-primary">
            Back to Home
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="border-b border-border-subtle bg-black py-10 sm:py-14">
        <div className="section-container">
          <p className="eyebrow mb-2">Checkout</p>
          <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Reserve your IRIZ</h1>
        </div>
      </div>

      <div className="section-container grid gap-8 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="glass-panel space-y-4 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                id="name"
                value={fields.name}
                onChange={update('name')}
                error={errors.name}
                autoComplete="name"
              />
              <Field
                label="Mobile Number"
                id="phone"
                value={fields.phone}
                onChange={update('phone')}
                error={errors.phone}
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
              />
            </div>
            <Field
              label="Email"
              id="email"
              type="email"
              value={fields.email}
              onChange={update('email')}
              error={errors.email}
              autoComplete="email"
            />
            <Field
              label="Address"
              id="address"
              value={fields.address}
              onChange={update('address')}
              error={errors.address}
              autoComplete="street-address"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="City"
                id="city"
                value={fields.city}
                onChange={update('city')}
                error={errors.city}
                autoComplete="address-level2"
              />
              <div>
                <label htmlFor="state" className="mb-1.5 block text-xs font-medium text-white/50">
                  State
                </label>
                <select
                  id="state"
                  value={fields.state}
                  onChange={update('state')}
                  className="w-full rounded-xl border border-border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-accent-soft"
                >
                  <option value="" className="bg-black">
                    Select state
                  </option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s} className="bg-black">
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-xs text-red-400">{errors.state}</p>}
              </div>
              <Field
                label="Pincode"
                id="pincode"
                value={fields.pincode}
                onChange={update('pincode')}
                error={errors.pincode}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </div>

          <div className="glass-panel space-y-3 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Preferred Payment Method</h2>
            <p className="text-xs text-white/45">
              This reserves your unit — no payment is collected now. We'll contact you to confirm and complete
              payment this way.
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    paymentMethod === opt.id
                      ? 'border-accent-soft bg-accent-soft/10'
                      : 'border-border-subtle bg-white/[0.02] hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={paymentMethod === opt.id}
                    onChange={() => setPaymentMethod(opt.id)}
                    className="accent-accent"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">{opt.label}</span>
                    <span className="block text-xs text-white/50">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {submitError && (
            <p role="alert" className="text-sm font-medium text-red-400">
              {submitError}
            </p>
          )}

          <Magnetic
            as="button"
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            strength={0.1}
          >
            {submitting ? 'Reserving your unit…' : `Reserve Yours — ${formatPrice(total)}`}
          </Magnetic>
        </form>

        <aside className="h-fit space-y-5 glass-panel p-6 sm:p-8 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>
          <div className="flex gap-4">
            <div className="product-photo-frame relative h-20 w-20 shrink-0">
              <Image src={product.image} alt={product.name} fill sizes="80px" className="product-photo" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{product.name}</p>
              <p className="text-xs text-white/50">Qty {qty}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-white">{formatPrice(PRICING.offerPrice)}</span>
                <span className="text-xs text-white/40 line-through">{formatPrice(PRICING.mrp)}</span>
              </div>
            </div>
          </div>

          <dl className="space-y-2 border-t border-border-subtle pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Subtotal</dt>
              <dd className="text-white">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Shipping</dt>
              <dd className="text-accent-soft">{SHIPPING_FLAT === 0 ? 'Free' : formatPrice(SHIPPING_FLAT)}</dd>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-2 text-base font-bold">
              <dt className="text-white">Total</dt>
              <dd className="text-white">{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-white/45">Estimated delivery: {DELIVERY_ESTIMATE}</p>
        </aside>
      </div>
    </PageShell>
  );
}
