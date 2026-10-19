'use client';

import { useMemo, useState } from 'react';

/**
 * Search across the FAQ and the troubleshooting list, from the support hub.
 *
 * WHY IT IS HERE AND NOT ON /support/faq. "Find the answer" is the single
 * commonest reason to arrive at a support hub, and it currently takes two
 * clicks and a page of scrolling to start. The box is the first interactive
 * thing on the page for that reason.
 *
 * CLIENT-SIDE, OVER DATA THE PAGE ALREADY HAS. The whole corpus is eleven
 * short entries from lib/iriz.js, passed in as a prop and matched in memory.
 * No index, no request, no dependency: anything more would be infrastructure
 * for a dataset that fits in a paragraph.
 *
 * EVERY RESULT IS A DEEP LINK into the accordion on /support/faq, which
 * opens the matching answer and scrolls to it (components/FaqAccordion). So
 * search does not try to BE the answer page — it is a way into it, which
 * keeps one canonical place where an answer lives.
 *
 * NO RESULTS IS A ROUTE, NOT A DEAD END. An empty search offers contact,
 * because someone who searched and found nothing is exactly the person who
 * needs a human.
 */

/** Mirrors the id scheme in components/FaqAccordion. */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export default function AnswerSearch({ faqs = [], fixes = [], faqHref, contactHref }) {
  const [query, setQuery] = useState('');

  const corpus = useMemo(
    () => [
      ...faqs.map((f) => ({
        id: `faq-${slugify(f.q)}`,
        question: f.q,
        answer: f.a,
        topic: f.topic || 'General',
        kind: 'Question',
      })),
      ...fixes.map((t) => ({
        id: `fix-${slugify(t.issue)}`,
        question: t.issue,
        answer: t.fix,
        topic: t.topic || 'General',
        kind: 'Fix',
      })),
    ],
    [faqs, fixes]
  );

  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (term.length < 2) return [];
    return corpus
      .map((entry) => {
        const q = entry.question.toLowerCase();
        const a = entry.answer.toLowerCase();
        // A hit in the QUESTION outranks a hit in the answer: someone typing
        // "wi-fi" wants the question about Wi-Fi, not the longest answer that
        // happens to mention it.
        const score = (q.includes(term) ? 2 : 0) + (a.includes(term) ? 1 : 0);
        return { entry, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.entry);
  }, [corpus, term]);

  const searching = term.length >= 2;

  return (
    <div className="max-w-xl">
      <label htmlFor="answer-search" className="sr-only">
        Search answers and fixes
      </label>

      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="pointer-events-none absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/55"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>

        <input
          id="answer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search answers — brightness, Wi-Fi, keystone…"
          autoComplete="off"
          className="h-[52px] w-full rounded-full border border-border bg-black-surface/80 pl-[52px] pr-5 text-sm text-white placeholder:text-white/55 backdrop-blur-glass transition-colors focus:border-accent-soft/50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
        />
      </div>

      {/* `aria-live` so a screen reader hears the count change without the
          focus leaving the field it is still being typed into. */}
      <div aria-live="polite" className="sr-only">
        {searching ? `${results.length} result${results.length === 1 ? '' : 's'}` : ''}
      </div>

      {searching && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border-subtle bg-black-surface/90 backdrop-blur-glass">
          {results.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {results.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`${faqHref}#${entry.id}`}
                    className="flex min-h-[44px] flex-col gap-1 px-5 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-soft"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-soft">
                        {entry.topic}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                        {entry.kind}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-white">{entry.question}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-5">
              <p className="text-sm text-white/65">
                No answer matches &ldquo;{query.trim()}&rdquo;.
              </p>
              <a
                href={contactHref}
                className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-accent-soft underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              >
                Ask our team instead
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
