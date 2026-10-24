'use client';

import { useState } from 'react';
import { CLUB_PATH } from '@/lib/club';

/**
 * Sign out of the Club on this device.
 *
 * A POST, through a button, never a link. A GET sign-out is a URL anybody can
 * put in an `<img>` on another page to log a member out, and it is also the
 * one that link prefetchers and antivirus scanners follow by accident.
 *
 * IT NAVIGATES WHATEVER HAPPENS. If the request fails — offline, a 500, the
 * Worker asleep — the member still ends up at the door. The alternative is a
 * person who pressed "sign out", saw an error, and reasonably believes they
 * are still signed in on a shared machine. The cookie that matters is cleared
 * by the server when it can be; the navigation is so the page cannot lie
 * about what happened.
 *
 * `window.location.assign`, not `router.push`: the cookie just changed and
 * /club is a server component that reads it. A client transition would run
 * against a router cache from before the change.
 */
export default function ClubSignOut({ className = 'btn-secondary' }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/club/signout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Deliberately swallowed — see the note above.
    }
    window.location.assign(CLUB_PATH);
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
