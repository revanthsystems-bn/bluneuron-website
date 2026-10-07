'use client';

import { useState } from 'react';
import Reveal from './Reveal';
import NotifyFields from './notify/NotifyFields';
import NotifySuccess from './notify/NotifySuccess';
import { NOTIFY_SOURCES } from '@/lib/web3forms';
import { SHOW_PRIVACY } from '@/lib/iriz';

/**
 * The inline signup at the bottom of the page — the same signup as the modal,
 * met by scrolling rather than by asking.
 *
 * Identical to the modal by CONSTRUCTION, not by coincidence: both render
 * components/notify/NotifyFields, so the fields, the +91 prefix, the
 * validation, the button and every state come from one file. Only the `source`
 * and the surrounding section chrome differ. Before this, the two had separate
 * markup and had already drifted — different placeholders, a different phone
 * rule, and a different success line.
 *
 * No `onDone` on the success view: there is nothing to close here, so the
 * confirmation simply replaces the form in place.
 */
export default function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section id="buy" className="relative overflow-hidden border-b border-border-subtle bg-black py-20 scroll-mt-20">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-noise" />
      <div className="section-container relative">
        <Reveal className="text-center">
          <p className="notify-pill mx-auto">
            <span className="notify-dot" aria-hidden="true" />
            Launching soon
          </p>
          <h2 className="type-display mx-auto mt-5 max-w-lg text-[2rem] leading-[1.05] text-white sm:text-[2.5rem]">
            Be the first to see <span className="notify-brand">IRIZ</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
            One message the day IRIZ launches. That&apos;s it.
          </p>
        </Reveal>

        <div className="mx-auto mt-2 max-w-md">
          {done ? (
            <div className="pt-8">
              <NotifySuccess />
            </div>
          ) : (
            <>
              <NotifyFields
                source={NOTIFY_SOURCES.inlineForm}
                onSuccess={() => setDone(true)}
              />
              <p className="mt-5 text-center text-[11px] leading-relaxed text-white/35">
                No spam. Unsubscribe anytime.
                {SHOW_PRIVACY && (
                  <>
                    {' '}
                    See our{' '}
                    <a
                      href="/legal/privacy"
                      className="underline underline-offset-2 transition-colors hover:text-white/60"
                    >
                      Privacy Policy
                    </a>
                    .
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
