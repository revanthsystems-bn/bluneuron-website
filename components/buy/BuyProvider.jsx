'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

/**
 * The sheet's CODE, not just its markup, is deferred.
 *
 * `renders nothing until opened` was already true of the markup, but a static
 * import still put BuySheet — and framer-motion and the lucide icon it pulls
 * in with it — into the JavaScript of every page at load. This provider sits
 * in the root layout, so that was every page on the site paying for a modal
 * most visitors never open.
 *
 * `ssr: false` is correct here and not a shortcut: the sheet is a dialog that
 * can only be opened by a click, so there is no first paint of it to server
 * render, and nothing in it is content a crawler should see.
 */
const BuySheet = dynamic(() => import('./BuySheet'), { ssr: false });

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
 * It renders NOTHING until something opens it, and since the dynamic import
 * above it does not even DOWNLOAD anything until then — so the cost of this
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
  // Latched: once the sheet has been opened, keep it mounted so closing and
  // reopening does not re-request the chunk and re-run its entry animation
  // from a cold start.
  const [everOpened, setEverOpened] = useState(false);

  const openBuySheet = useCallback(() => {
    setEverOpened(true);
    setOpen(true);
  }, []);
  const closeBuySheet = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openBuySheet, closeBuySheet }),
    [open, openBuySheet, closeBuySheet],
  );

  return (
    <BuyContext.Provider value={value}>
      {children}
      {everOpened && <BuySheet open={open} onClose={closeBuySheet} />}
    </BuyContext.Provider>
  );
}
