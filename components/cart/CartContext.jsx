'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCT } from '@/lib/iriz';
import { confirmedPriceInr } from '@/lib/site-config';

const CartContext = createContext(null);
const STORAGE_KEY = 'bluneuron-cart-v1';
const MAX_QTY = 10;

function readStoredQty() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const qty = Number(parsed?.qty);
    return Number.isFinite(qty) && qty > 0 ? Math.min(qty, MAX_QTY) : 0;
  } catch {
    return 0;
  }
}

// The site sells a single SKU (IRIZ), so "cart state" is just a quantity —
// no item list/lookup needed. Revisit if a second product ever ships.
export function CartProvider({ children }) {
  const [qty, setQty] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setQty(readStoredQty());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (qty > 0) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ qty }));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable (private mode, disabled) — cart just won't persist.
    }
  }, [qty, hydrated]);

  const addItem = useCallback((amount = 1) => {
    setQty((q) => Math.min(Math.max(q, 0) + amount, MAX_QTY));
  }, []);

  const setItemQty = useCallback((next) => {
    setQty(Math.max(0, Math.min(Math.round(next) || 0, MAX_QTY)));
  }, []);

  const removeItem = useCallback(() => setQty(0), []);
  const clear = useCallback(() => setQty(0), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  /**
   * THE PRICE COMES FROM lib/site-config.js, not from PRICING in lib/iriz.js.
   *
   * The two happen to hold the same number today, and that is exactly why
   * this has to be explicit. PRICING is the price this site INTENDED to sell
   * at through the in-site cart that no longer exists; MARKETPLACE.priceInr
   * is what a live listing actually charges, and it is the one figure the
   * buy card, /where-to-buy and the Product structured data all quote. A
   * basket that totalled a different number from the product page would be
   * the single worst place for those two to drift apart.
   *
   * `confirmedPriceInr()` returns null rather than a placeholder when no
   * real price is set, so the subtotal is null and every consumer has to
   * decide what to show instead of quietly rendering "₹NaN".
   *
   * NO MRP, AND NO "YOU SAVE". The old basket showed a struck-through
   * ₹39,999 beside the total. We do not set the price Amazon and Flipkart
   * charge, so we are in no position to state what a buyer is saving
   * against — that is a discount claim about someone else's listing.
   */
  const unitPrice = confirmedPriceInr();
  const subtotal = unitPrice === null ? null : qty * unitPrice;

  const value = useMemo(
    () => ({
      product: PRODUCT,
      qty,
      itemCount: qty,
      unitPrice,
      subtotal,
      isOpen,
      hydrated,
      addItem,
      setItemQty,
      removeItem,
      clear,
      openCart,
      closeCart,
    }),
    [qty, unitPrice, subtotal, isOpen, hydrated, addItem, setItemQty, removeItem, clear, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
