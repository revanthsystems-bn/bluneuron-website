'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * The FAQ accordion: grouped by topic, animated, and deep-linkable.
 *
 * THREE THINGS CHANGED, and each had a reason.
 *
 * 1. GROUPED. It was one flat list, so finding the answer about sound meant
 *    reading past every answer about brightness. `topic` on each item
 *    (lib/iriz.js) is metadata only — no question or answer was reworded.
 *    Items with no topic fall into "General" rather than vanishing.
 *
 * 2. EVERY ANSWER IS IN THE SERVER HTML. Each item is a native <details>.
 *
 *    It was a React-conditional panel inside <AnimatePresence>, so the answer
 *    did not EXIST in the markup until the item was opened — which means it
 *    existed only for visitors running the bundle. On a support page that is
 *    the same failure the rest of this branch exists to remove: 20 questions
 *    with no readable answers in an in-app browser off a QR scan, while the
 *    FAQPage structured data on the same page advertised all 20 answers to
 *    Google. Measured before the change: 20 questions in the DOM with
 *    JavaScript disabled, 0 answers.
 *
 *    <details> puts the answer in the markup, collapsed, and makes the toggle
 *    work with no JavaScript at all. The cost is the height tween, which
 *    framer could only animate on an element it was mounting — a fair trade
 *    for an answer that is there at all. The plus still rotates into a cross
 *    on open (`group-open:rotate-45`), and `motion-reduce:transition-none`
 *    drops that tween rather than the state.
 *
 * 3. DEEP-LINKABLE. Every item has a stable id derived from its question, so
 *    support can send a link straight to one answer. On load and on
 *    `hashchange` the matching item opens and scrolls into view.
 *
 * ONE OPEN AT A TIME, without state. `name` on <details> is the native
 * exclusive accordion: opening one closes its siblings, in the browser,
 * before any of our code runs. Browsers without it allow two open, which is a
 * slightly longer page and not a broken one. These are short answers in a
 * long list, and letting them all open turns the page back into the wall of
 * text the grouping exists to break up.
 *
 * 4. SEARCHABLE, where the page asks for it (`searchable`). Progressive
 *    enhancement: with no JavaScript the box renders and does nothing, and
 *    every question and answer is still on the page underneath it.
 */

/** A question turned into a stable fragment id. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export default function FaqAccordion({ items, idPrefix = 'faq', searchable = false }) {
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');

  // Normalised once: every item gets an id and a topic, so the render below
  // never has to care whether the source array supplied either.
  const allGroups = useMemo(() => {
    const byTopic = new Map();
    for (const item of items) {
      const topic = item.topic || 'General';
      if (!byTopic.has(topic)) byTopic.set(topic, []);
      byTopic.get(topic).push({
        ...item,
        id: `${idPrefix}-${slugify(item.q || item.issue)}`,
        question: item.q || item.issue,
        answer: item.a || item.fix,
      });
    }
    return [...byTopic.entries()].map(([topic, entries]) => ({ topic, entries }));
  }, [items, idPrefix]);

  /**
   * The filter.
   *
   * Question AND answer AND topic, because people search for the words in
   * the answer at least as often as the words in the question — someone
   * typing "keystone" wants the entry titled "Do I have to square the image
   * again", which does not contain it.
   *
   * No debounce. This is a synchronous filter over a twenty-item array held
   * in memory: there is nothing to wait for, and a delay here would only put
   * the list behind the typing.
   *
   * A topic whose entries all fail the filter is dropped rather than rendered
   * empty, so the result is a short list and not a page of headings.
   */
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups
      .map((group) => ({
        ...group,
        entries: group.entries.filter((e) =>
          `${e.question} ${e.answer} ${group.topic}`.toLowerCase().includes(q)),
      }))
      .filter((group) => group.entries.length);
  }, [allGroups, query]);

  const total = useMemo(
    () => groups.reduce((n, g) => n + g.entries.length, 0),
    [groups],
  );
  const searching = Boolean(query.trim());

  /**
   * Open whatever the URL fragment names.
   *
   * Runs on mount AND on `hashchange`: a visitor following a second support
   * link while already on the page changes only the fragment, which fires no
   * navigation and would otherwise leave the previous answer open.
   */
  const openFromHash = useCallback(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // `allGroups`, not `groups`: a support link to one answer has to open it
    // even if a filter is currently hiding it.
    const match = allGroups.flatMap((g) => g.entries).find((e) => e.id === hash);
    if (!match) return;
    setOpenId(match.id);
    // After the state flush, so the element is expanded before we scroll to
    // it — scrolling first lands on a collapsed row and the answer then
    // pushes the page under the reader.
    requestAnimationFrame(() => {
      document.getElementById(match.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [allGroups]);

  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [openFromHash]);

  return (
    <div className="space-y-10">
      {/* ----------------------------------------------------------------- *
       * THE SEARCH BOX.
       *
       * Progressive enhancement, and it has to be: with no JavaScript the
       * input renders and does nothing, and every question is still on the
       * page underneath it, grouped and readable. Nothing is hidden behind
       * the filter that was not already visible without it.
       *
       * The label is sr-only. A visible label above a search field is
       * unusual enough to read as a form rather than a search, and the
       * magnifier plus the placeholder carry it visually — but a placeholder
       * is not an accessible name, so the real <label> is there for anyone
       * not looking at it.
       *
       * `type="search"` gets the platform's own clear button and the search
       * keyboard on a phone. The count is in an aria-live region because the
       * list changing under you is silent otherwise.
       * ----------------------------------------------------------------- */}
      {searchable && (
        <div>
          <label htmlFor={`${idPrefix}-search`} className="sr-only">
            Search the questions
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40"
              aria-hidden="true"
            />
            <input
              id={`${idPrefix}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions and answers"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-border bg-white/[0.04] pl-12 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent-soft focus-visible:ring-2 focus-visible:ring-accent-soft"
            />
          </div>

          <p aria-live="polite" className="mt-2 min-h-[20px] text-xs text-white/45">
            {searching
              ? `${total} ${total === 1 ? 'answer' : 'answers'} matching "${query.trim()}"`
              : ''}
          </p>
        </div>
      )}

      {/* A dead end is the one thing a search must not be: the message names
          what was searched for and offers the two routes out, rather than
          leaving a blank column. */}
      {searchable && searching && total === 0 && (
        <div className="glass-panel p-8 text-center">
          <p className="text-sm font-semibold text-white">
            Nothing matches &ldquo;{query.trim()}&rdquo;
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
            Try a shorter word — &ldquo;keystone&rdquo;, &ldquo;Wi-Fi&rdquo;,
            &ldquo;warranty&rdquo; — or clear the box to see every question.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-accent-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
          >
            Clear search
          </button>
        </div>
      )}

      {/* No scroll reveal: see components/Reveal.jsx. This accordion is
          the body of /support/faq, which is read rather than browsed. */}
      {groups.map((group) => (
        <div key={group.topic}>
          {/* The topic label is a real heading, so the groups are navigable
              by heading in a screen reader and not just visually separated. */}
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {group.topic}
          </h3>

          <div className="divide-y divide-border-subtle overflow-hidden rounded-3xl border border-border-subtle bg-black-surface/60">
            {group.entries.map((entry) => (
              <details
                key={entry.id}
                id={entry.id}
                // Native exclusive accordion: browsers that support `name`
                // close the sibling when one opens, which is the
                // one-open-at-a-time behaviour this list wants, with no state
                // to hold. Older browsers simply allow two open, which is a
                // slightly longer page and not a broken one.
                name={`${idPrefix}-${group.topic}`}
                open={openId === entry.id || undefined}
                onToggle={(e) => {
                  if (!e.currentTarget.open) return;
                  setOpenId(entry.id);
                  // Keep the address bar in step, so the answer a visitor is
                  // reading is the one they can copy a link to.
                  // `replaceState`, not a hash assignment: writing
                  // `location.hash` pushes a history entry, and Back would
                  // then close an accordion instead of leaving the page.
                  window.history.replaceState(null, '', `#${entry.id}`);
                }}
                className="group scroll-mt-24"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-left text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-soft sm:px-7 [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  {/* A plus that rotates into a minus. One glyph, one
                      transform — cheaper than swapping icons and it cannot
                      land mid-swap. `motion-reduce` drops the tween and keeps
                      the state. */}
                  <span
                    aria-hidden="true"
                    className="relative h-4 w-4 shrink-0 text-white/55 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  >
                    <span className="absolute left-1/2 top-1/2 h-[1.5px] w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-4 w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded bg-current" />
                  </span>
                </summary>

                <p className="max-w-[68ch] px-5 pb-5 text-sm leading-[1.7] text-white/65 sm:px-7">
                  {entry.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
