'use client';

import { User } from 'lucide-react';
import { useAccount } from './AccountContext';
import { ROUTES } from '@/lib/routes';
import { ACCOUNTS_ENABLED } from '@/lib/site-config';

/**
 * The masthead's account control: a link, not a menu.
 *
 * SIGNED OUT it goes to /sign-in; SIGNED IN it goes to /account. One tap
 * either way, and no dropdown — a menu here would hold the same four
 * destinations the account area already lists down its own side, and a
 * hover menu is a trap on a touch screen. The account area is the menu.
 *
 * The avatar is INITIALS, not a photo. We do not hold one: email OTP never
 * supplies a picture, and a Google avatar would make the control change
 * shape depending on how someone signed in. Initials on the accent ring are
 * the same size and weight whichever way they arrived.
 *
 * The `ink` prop is GONE, with the light-hero test it existed for
 * (components/Header has the note). The masthead is light-on-dark in every
 * state now, so there is one icon colour. Same change, same reason, as
 * CartButton.
 */
/**
 * The gate. No hooks of its own, so the early return cannot reorder the
 * ones below. Accounts are off site-wide: nothing here needs a sign-in,
 * and warranty registration and claims stay guest forms. See
 * ACCOUNTS_ENABLED in lib/site-config.
 */
export default function AccountButton(props) {
  if (!ACCOUNTS_ENABLED) return null;
  return <AccountButtonControl {...props} />;
}

function AccountButtonControl({ className = '' }) {
  const { user, hydrated } = useAccount();

  const base = `relative flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-500 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft ${className}`;

  // Before hydration we do not know whether anyone is signed in. Render the
  // signed-OUT control rather than a spinner or nothing: it is the same size
  // and the same position, so the swap costs no layout shift, and it is the
  // correct answer for every first-time visitor.
  if (!hydrated || !user) {
    return (
      <a href={ROUTES.signIn} aria-label="Sign in" className={base}>
        <User size={20} aria-hidden="true" />
      </a>
    );
  }

  return (
    <a href={ROUTES.account} aria-label={`Account — signed in as ${user.name || user.email}`} className={base}>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-step-0 font-semibold uppercase tracking-wide text-accent-soft"
      >
        {initialsOf(user)}
      </span>
    </a>
  );
}

/**
 * Up to two initials, from the name if we have one and the email if we do
 * not. An email-OTP signup gives us an address and nothing else until the
 * profile is filled in, so "RS" and "sy" are both normal states here.
 */
function initialsOf(user) {
  const source = (user.name || '').trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).slice(0, 2);
  }
  return (user.email || '?').slice(0, 2);
}
