'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCT, PRICING } from '@/lib/iriz';

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

  const subtotal = qty * PRICING.offerPrice;
  const mrpSubtotal = qty * PRICING.mrp;

  const value = useMemo(
    () => ({
      product: PRODUCT,
      qty,
      itemCount: qty,
      subtotal,
      mrpSubtotal,
      isOpen,
      hydrated,
      addItem,
      setItemQty,
      removeItem,
      clear,
      openCart,
      closeCart,
    }),
    [qty, subtotal, mrpSubtotal, isOpen, hydrated, addItem, setItemQty, removeItem, clear, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
