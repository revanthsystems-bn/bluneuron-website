'use client';

import { useState } from 'react';
import NotifyFields from './NotifyFields';
import { NOTIFY_SOURCES } from '@/lib/web3forms';
import { SHOW_PRIVACY } from '@/lib/iriz';

/**
 * The footer's subscribe box — the SAME launch list as the modal and the
 * inline form at the bottom of the homepage.
 *
 * It renders components/notify/NotifyFields in its `pill` variant, so the
 * endpoint, the validation, the honeypot, what counts as success and the Meta
 * Pixel `Lead` event are all the one shared implementation. The only things
 * this file decides are the shape of the confirmation and the `source` tag
 * (`footer`, which lands in the same Web3Forms inbox — see NOTIFY_SOURCES).
 *
 * NOTHING PERSONAL LEAVES THIS FLOW. The email goes to Web3Forms and nowhere
 * else: the pixel gets a bare `Lead` with no parameters, and no Google
 * Analytics event is sent at all — the launch signup has never had one, and
 * inventing one here would be a new event rather than the existing flow. If a
 * GA event is ever wanted for signups it belongs in NotifyFields, beside the
 * pixel call, so all three surfaces report it at once.
 *
 * ---------------------------------------------------------------------------
 * THE CONSENT LINE NAMES THE PRIVACY POLICY AND DOES NOT LINK IT.
 * ---------------------------------------------------------------------------
 * Everywhere else on the site that sentence carries an anchor to
 * /legal/privacy. Here it cannot: the footer's rule is that no two of its
 * links point at the same URL (see FOOTER_COLUMNS in lib/routes.js and
 * scripts/assert-footer-links.mjs), and the Policies column — a few
 * centimetres away in the same footer, under a heading a reader scanning for
 * exactly this is already reading — holds the one copy. The WORDING is
 * unchanged from components/Newsletter so the two surfaces ask for the same
 * consent in the same words; only the anchor is absent.
 *
 * With SHOW_PRIVACY off it falls back to the reassurance copy rather than to
 * nothing, so the fine print never disappears entirely.
 */
export default function FooterSubscribe() {
  const [done, setDone] = useState(false);

  /*
   * A COMPACT confirmation, not components/notify/NotifySuccess.
   *
   * That component is a 72px glowing ring, a display headline and two lines
   * of body copy — right for a modal that has nothing else in it, and three
   * times the height of the pill it would be replacing here. Swapping it in
   * would jump the whole brand column and push the social row down the page
   * at the moment someone finishes typing. One line in the pill's own place
   * instead, with `role="status"` so it is announced rather than only seen.
   */
  if (done) {
    return (
      <p
        role="status"
        className="mt-5 flex min-h-[54px] items-center gap-2.5 rounded-full border border-accent/30 bg-accent/[0.08] px-5 text-sm text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="#93b8fb"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4.5 12.5l5 5 10-10" />
        </svg>
        You&apos;re on the list.
      </p>
    );
  }

  return (
    <>
      <NotifyFields
        variant="pill"
        source={NOTIFY_SOURCES.footer}
        submitLabel="Subscribe"
        onSuccess={() => setDone(true)}
      />
      {/* `text-white/50` and not the /35 the homepage form uses for the same
          sentence. At 11px on black, white/35 composites to #595959 — 2.99:1,
          well under the 4.5:1 AA minimum, and this footer puts the line on
          every page rather than on one. /50 is #808080 and 5.3:1. Measured
          with axe-core via scripts/ui-audit.mjs; the homepage copy
          (components/Newsletter) is the same defect at one call site and is
          worth the same fix, which is a separate change. */}
      <p className="mt-3 text-[11px] leading-relaxed text-white/50">
        {SHOW_PRIVACY
          ? 'By signing up, you agree to our Privacy Policy.'
          : 'No spam. Unsubscribe anytime.'}
      </p>
    </>
  );
}
