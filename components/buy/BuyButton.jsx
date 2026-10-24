'use client';

import { useBuySheet } from './BuyProvider';

/**
 * The one Buy affordance. Every "Buy" on the site is this.
 *
 * It is a <button>, not a link, and that is the correct element: it opens a
 * dialog on this page rather than navigating anywhere. The old masthead CTA
 * was an <a href="/#buy"> that scrolled the homepage to a card — which
 * meant that from a policy page "Buy" was a cross-page jump to somewhere
 * the visitor then had to find.
 *
 * `aria-haspopup="dialog"` tells a screen reader what the press will do
 * before it happens, which a bare "Buy" does not.
 *
 * Styling comes in through `className` so a call site can pick the tone
 * (btn-primary / btn-primary-ink over the light hero / btn-secondary) and
 * the size, without this component knowing about any of them.
 */
export default function BuyButton({
  className = 'btn-primary',
  children = 'Buy',
  onClick,
  ...rest
}) {
  const { openBuySheet } = useBuySheet();

  /*
   * `onClick` is pulled out of the props and COMPOSED, never spread.
   *
   * Call sites pass their own handler for their own reason — the mobile
   * menu passes one that closes the menu — and with `{...rest}` landing
   * after `onClick={openBuySheet}` theirs would silently replace ours and
   * the button would close the menu and open nothing. Both run, caller
   * first, so the menu is already closing as the sheet arrives.
   */
  const handleClick = (event) => {
    onClick?.(event);
    openBuySheet();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-haspopup="dialog"
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
