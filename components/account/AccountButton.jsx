'use client';

import { User } from 'lucide-react';
import { useAccount } from './AccountContext';
import { ROUTES } from '@/lib/routes';

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
 * `ink` is the light-hero test (lib/heroTheme.js) — over the white hero the
 * icon has to be dark. Same prop, same meaning, as CartButton.
 */
export default function AccountButton({ className = '', ink = false }) {
  const { user, hydrated } = useAccount();

  const base = `relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft ${
    ink
      ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
      : 'text-white/80 hover:bg-white/5 hover:text-white'
  } ${className}`;

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
        className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-[11px] font-semibold uppercase tracking-wide text-accent-soft"
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
