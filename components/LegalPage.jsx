import PageShell from './PageShell';
import PageHeading from './PageHeading';
import DraftBanner from './DraftBanner';
import PolicyToc from './legal/PolicyToc';
import { ROUTES } from '@/lib/routes';

/**
 * A heading turned into a stable fragment id.
 *
 * Derived from the heading TEXT rather than the array index, so a link into
 * a policy survives a section being inserted above it — an index-based
 * anchor would silently start pointing at the wrong clause, which on a legal
 * page is the worst kind of broken link.
 */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

/**
 * Turn the route paths written inside a policy sentence into real links.
 *
 * These pages cross-reference each other constantly — "see /legal/warranty",
 * "use the claim form at /support/warranty-claim" — and the `sections` shape
 * is plain strings, so every one of those used to render as literal grey
 * text. On pages that were drafts nobody was meant to read, that was
 * tolerable. On published, indexed policy pages it is not: the reader most
 * likely to need the cross-reference is on a phone, and a path they have to
 * retype is a path they do not follow.
 *
 * It matches ONLY paths that are in the ROUTES registry (lib/routes.js),
 * longest first so /support/warranty-claim wins over /support. That is the
 * whole safety property: a sentence cannot accidentally produce a link to a
 * page that does not exist, and a typo'd path stays visibly plain text
 * instead of becoming a dead link — which is the failure mode of the obvious
 * implementation, a regex for anything that looks like a path.
 *
 * The lookbehind-free construction matters: the pattern is built from
 * escaped literals and anchored with a boundary check on the following
 * character, so /specs inside /specs-and-more would not match.
 */
const ROUTE_PATHS = [...new Set(Object.values(ROUTES))]
  .filter((p) => p !== '/')
  .sort((a, b) => b.length - a.length);

const ROUTE_PATTERN = new RegExp(
  `(${ROUTE_PATHS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w/-])`,
  'g'
);

function linkify(text) {
  if (typeof text !== 'string') return text;
  const parts = text.split(ROUTE_PATTERN);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    ROUTE_PATHS.includes(part) ? (
      <a
        // The index is stable here: `parts` comes from one deterministic
        // split of one constant string, and nothing reorders or filters it.
        // eslint-disable-next-line react/no-array-index-key
        key={`${part}-${i}`}
        href={part}
        className="text-white/85 underline underline-offset-2 transition-colors hover:text-white"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

/**
 * The shell every policy page but one renders through: /legal/warranty,
 * /legal/returns, /legal/shipping, /legal/terms and /legal/grievance.
 *
 * (/legal/privacy is the exception and is written out longhand. It is a real,
 * finished document that needs markup this `sections` shape cannot express —
 * bold lead-ins inside list items, mailto links, a paragraph after a list in
 * the same section. See the comment at the top of that file.)
 *
 * THE BANNER IS NO LONGER HARDCODED. It used to be unconditional here, which
 * meant /legal/privacy could not use this shell without being labelled a
 * draft, and a page whose placeholders were filled in would have kept the
 * banner until someone noticed. Now the page passes its own route `path` and
 * components/DraftBanner decides from the one table in lib/routes.js — the
 * same table the `noindex` is read from, so the two can never disagree.
 *
 * The "Draft prepared <date>" footer line is gone with it. It dated the
 * placeholder text rather than the policy, so it aged into a claim that the
 * terms were reviewed on a day when they were not written yet. What a reader
 * needs instead is `lastUpdated`, which only a finished policy can honestly
 * carry — so it renders only when given.
 *
 * SECTION SHAPE. `body` is either a string (a paragraph) or an array (a
 * bulleted list), and both may contain the [TBD] marker from
 * lib/site-config.js — that is the point. A section may also carry `note`,
 * rendered as smaller secondary type under the body, for the "who decides
 * this" caveats that would otherwise be buried in the main prose.
 *
 * `effectiveFrom` IS NOT `lastUpdated`, and the warranty page needs the other
 * one. A revision date tells a reader whether to re-read the page; an
 * EFFECTIVE date tells them which terms apply to the unit in their hands,
 * which is the only question a warranty's date has to answer — a unit bought
 * under earlier terms is covered by those. Four policies pass `lastUpdated`;
 * /legal/warranty passes this. Passing both is allowed and prints both lines,
 * which is what a revised warranty would want.
 */
export default function LegalPage({
  title,
  path,
  sections,
  intro,
  lastUpdated,
  effectiveFrom,
}) {
  // Built from the headings the page already renders, so the contents list
  // can never advertise a section that is not there.
  const toc = sections.map((section) => ({
    id: slugify(section.heading),
    heading: section.heading,
  }));

  return (
    <PageShell>
      <PageHeading eyebrow="Legal" title={title} subtitle={intro} />

      <section className="bg-black py-14 sm:py-18">
        <div className="section-container">
          <DraftBanner path={path} className="mb-10 max-w-[680px]" />

          {/*
            TWO COLUMNS AT lg, ONE BELOW IT.

            `lg:grid-cols-[232px_minmax(0,680px)]` rather than fractions: the
            prose measure is the thing being protected (680px keeps a 16px
            line near the 65-75 characters that stay readable in continuous
            text), so it is stated as a real maximum and the contents rail
            takes a fixed width beside it. A fractional split would let the
            measure drift with the viewport, which is the one thing a reading
            column must not do.

            `items-start` so the sticky rail has somewhere to stick — a
            stretched grid item is full-height and `position: sticky` has no
            room to move inside it.
          */}
          <div className="grid gap-10 lg:grid-cols-[232px_minmax(0,680px)] lg:items-start lg:gap-14">
            <PolicyToc items={toc} />

            <div className="min-w-0">
              <div className="space-y-10 text-[15px] leading-[1.75] text-white/70">
                {/* Plain <section>s, no scroll reveal: see
                    components/Reveal.jsx. A policy is read, and a
                    policy that waits on a bundle is a blank page. */}
                {sections.map((section) => (
                  <section key={section.heading}>
                    {/*
                      `scroll-mt-24` is what makes the contents links usable:
                      the masthead is fixed, so an un-offset anchor jump puts
                      the heading underneath it and the reader lands on the
                      previous section's last line.
                    */}
                    <h2
                      id={slugify(section.heading)}
                      className="scroll-mt-24 text-xl font-semibold tracking-tight text-white"
                    >
                      {section.heading}
                    </h2>

                    <div className="mt-3">
                      {Array.isArray(section.body) ? (
                        <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
                          {section.body.map((line) => (
                            <li key={line}>{linkify(line)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{linkify(section.body)}</p>
                      )}
                    </div>

                    {/*
                      THE KEY-POINT BOX.

                      Opt-in per section via a `highlight` key, and it carries
                      NO new wording: a page supplies the figure it already
                      states in the prose above (the warranty period, the
                      return window) so the box is a pull-quote, not a second
                      source of truth that could drift from the policy.
                    */}
                    {section.highlight && (
                      <div className="mt-4 flex gap-3 rounded-2xl border border-accent-soft/25 bg-accent/[0.07] p-4 sm:p-5">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-soft"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" />
                        </svg>
                        <div className="min-w-0 text-[13px] leading-relaxed">
                          <p className="font-semibold text-white">{section.highlight.label}</p>
                          <p className="mt-1 text-white/70">{linkify(section.highlight.value)}</p>
                        </div>
                      </div>
                    )}

                    {section.note && (
                      <p className="mt-3 text-[13px] leading-relaxed text-white/55">
                        {linkify(section.note)}
                      </p>
                    )}
                  </section>
                ))}
              </div>

              {(lastUpdated || effectiveFrom) && (
                <div className="mt-12 border-t border-border-subtle pt-6">
                  {effectiveFrom && (
                    <p className="text-xs text-white/55">Effective from {effectiveFrom}.</p>
                  )}
                  {lastUpdated && (
                    <p className="mt-1 text-xs text-white/55">Last updated {lastUpdated}.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
