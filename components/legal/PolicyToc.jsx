'use client';

import { useEffect, useState } from 'react';

/**
 * The policy table of contents: a sticky rail on desktop, a collapsed
 * disclosure on mobile.
 *
 * WHY A POLICY NEEDS ONE. Measured on this build at 390px: /legal/privacy is
 * 7,142px tall and /legal/terms 6,543px. Both are a single column of prose
 * with no way to see what is in them or to reach the one clause you came
 * for. "What is the return window" should not be a scroll hunt.
 *
 * IT IS BUILT FROM THE HEADINGS THAT ALREADY EXIST — the `sections` array
 * each policy page passes to components/LegalPage — so it cannot list a
 * section the page does not render, and nobody has to maintain it. No legal
 * wording is touched to produce it.
 *
 * SCROLL SPY. An IntersectionObserver marks the section currently in view,
 * because a 12-entry list with nothing highlighted tells you where you can
 * go but not where you are. `rootMargin` pulls the detection line up to just
 * under the masthead so the active item changes as a heading reaches the top
 * of the readable area rather than the top of the window.
 *
 * `<details>` on mobile rather than a JS toggle: it is open/closed state
 * that the browser already owns, it works before hydration, and it collapses
 * to one 44px row instead of putting a 12-item list between the title and
 * the first paragraph.
 */
export default function PolicyToc({ items }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!items.length) return undefined;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    if (!headings.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost heading currently intersecting wins. Taking the last
        // entry instead would jump the highlight to the bottom of the screen
        // whenever two headings are visible at once, which on short sections
        // is most of the time.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      // Top inset clears the fixed masthead; the large bottom inset keeps the
      // "currently reading" band to the upper third of the viewport.
      { rootMargin: '-88px 0px -62% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  const list = (
    <ol className="space-y-0">
      {items.map((item, i) => {
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? 'true' : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[13px] leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft ${
                active
                  ? 'bg-white/[0.06] font-medium text-white'
                  : 'text-white/55 hover:bg-white/[0.03] hover:text-white/85'
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-4 shrink-0 text-right text-[11px] tabular-nums ${
                  active ? 'text-accent-soft' : 'text-white/30'
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">{item.heading}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Mobile: one 44px row that opens. */}
      <details className="mb-8 rounded-2xl border border-border-subtle bg-black-soft lg:hidden">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
          On this page
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 [details[open]_&]:rotate-180"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="border-t border-border-subtle px-1 py-2">{list}</div>
      </details>

      {/* Desktop: a sticky rail beside the prose. `top-24` clears the
          masthead; `max-h` + `overflow-y-auto` keeps a long contents list
          scrollable inside its own box rather than running off the screen. */}
      <nav
        aria-label="On this page"
        className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          On this page
        </p>
        {list}
      </nav>
    </>
  );
}
