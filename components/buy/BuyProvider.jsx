'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import BuySheet from './BuySheet';

/**
 * One sheet for the whole document, opened from anywhere.
 *
 * WHY A PROVIDER RATHER THAN A SHEET PER BUTTON. There are four Buy
 * affordances on a typical page — masthead, hero, the buy card, and the
 * mobile sticky bar — and a sheet mounted beside each would mean four
 * copies of a modal in the DOM, four focus traps, and an id collision on
 * every `aria-labelledby`. One instance at the root is also what makes the
 * sheet survive the button that opened it being scrolled away or unmounted.
 *
 * It renders NOTHING until something opens it: <BuySheet> is wrapped in
 * AnimatePresence and returns null while closed, so the cost of the
 * provider on a page nobody buys from is the context object alone.
 */
const BuyContext = createContext(null);

export function useBuySheet() {
  const ctx = useContext(BuyContext);
  if (!ctx) {
    // A Buy button outside the provider would silently do nothing, which
    // is the kind of bug that ships. Fail loudly in development instead.
    throw new Error('useBuySheet must be used inside <BuyProvider>');
  }
  return ctx;
}

export default function BuyProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openBuySheet = useCallback(() => setOpen(true), []);
  const closeBuySheet = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openBuySheet, closeBuySheet }),
    [open, openBuySheet, closeBuySheet],
  );

  return (
    <BuyContext.Provider value={value}>
      {children}
      <BuySheet open={open} onClose={closeBuySheet} />
    </BuyContext.Provider>
  );
}
