'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from './Reveal';

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
 * 2. ANIMATED. The panel was `hidden={!open}`, which is an instant swap: the
 *    page jumps by the height of the answer and nothing connects the press
 *    to the result. It now animates `height: auto`, which framer resolves to
 *    a real pixel height for the tween and hands back to `auto` on finish —
 *    so a long answer that reflows on resize is still correct afterwards.
 *
 * 3. DEEP-LINKABLE. Every item has a stable id derived from its question, so
 *    support can send a link straight to one answer. On load and on
 *    `hashchange` the matching item opens and scrolls into view.
 *
 * ONE OPEN AT A TIME is kept deliberately. These are short answers in a long
 * list; letting them all open turns the page back into the wall of text the
 * grouping exists to break up.
 *
 * MOTION IS OPT-OUT. <MotionConfig reducedMotion="user"> in app/layout.jsx
 * drops the transform and the height tween for anyone who asked for reduced
 * motion, leaving an instant open — which is the correct behaviour, not a
 * degraded one.
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

export default function FaqAccordion({ items, idPrefix = 'faq' }) {
  const [openId, setOpenId] = useState(null);

  // Normalised once: every item gets an id and a topic, so the render below
  // never has to care whether the source array supplied either.
  const groups = useMemo(() => {
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
   * Open whatever the URL fragment names.
   *
   * Runs on mount AND on `hashchange`: a visitor following a second support
   * link while already on the page changes only the fragment, which fires no
   * navigation and would otherwise leave the previous answer open.
   */
  const openFromHash = useCallback(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const match = groups.flatMap((g) => g.entries).find((e) => e.id === hash);
    if (!match) return;
    setOpenId(match.id);
    // After the state flush, so the element is expanded before we scroll to
    // it — scrolling first lands on a collapsed row and the answer then
    // pushes the page under the reader.
    requestAnimationFrame(() => {
      document.getElementById(match.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, [groups]);

  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [openFromHash]);

  return (
    <div className="space-y-10">
      {groups.map((group, gi) => (
        <Reveal key={group.topic} y={18} delay={Math.min(gi, 4) * 0.04}>
          {/* The topic label is a real heading, so the groups are navigable
              by heading in a screen reader and not just visually separated. */}
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            {group.topic}
          </h3>

          <div className="divide-y divide-border-subtle overflow-hidden rounded-3xl border border-border-subtle bg-black-surface/60">
            {group.entries.map((entry) => {
              const open = openId === entry.id;
              const panelId = `${entry.id}-panel`;

              return (
                <div key={entry.id} id={entry.id} className="scroll-mt-24">
                  <h4>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => {
                        setOpenId(open ? null : entry.id);
                        // Keep the address bar in step, so the answer a
                        // visitor is reading is the one they can copy a link
                        // to. `replaceState`, not a hash assignment: writing
                        // `location.hash` pushes a history entry, and Back
                        // would then close an accordion instead of leaving
                        // the page.
                        if (!open) {
                          window.history.replaceState(null, '', `#${entry.id}`);
                        }
                      }}
                      className="flex w-full min-h-[44px] items-center justify-between gap-6 px-5 py-5 text-left text-[15px] font-semibold text-white transition-colors hover:bg-white/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-soft sm:px-7"
                    >
                      {entry.question}
                      {/* A plus that rotates into a minus. One glyph, one
                          transform — cheaper than swapping icons and it
                          cannot land mid-swap. */}
                      <span
                        aria-hidden="true"
                        className={`relative h-4 w-4 shrink-0 text-white/45 transition-transform duration-300 ${
                          open ? 'rotate-45' : ''
                        }`}
                      >
                        <span className="absolute left-1/2 top-1/2 h-[1.5px] w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-current" />
                        <span className="absolute left-1/2 top-1/2 h-4 w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded bg-current" />
                      </span>
                    </button>
                  </h4>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={panelId}
                        role="region"
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[68ch] px-5 pb-5 text-sm leading-[1.7] text-white/65 sm:px-7">
                          {entry.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
