import PageShell from './PageShell';
import PageHeading from './PageHeading';
import DraftBanner from './DraftBanner';
import Reveal from './Reveal';
import { ROUTES } from '@/lib/routes';

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
        className="text-ink-2 underline underline-offset-2 transition-colors hover:text-white"
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
 */
export default function LegalPage({ title, path, sections, intro, lastUpdated }) {
  return (
    <PageShell>
      <PageHeading eyebrow="Legal" title={title} subtitle={intro} />

      <section className="bg-black section-y">
        {/* `max-w-prose-wide` on the PROSE, not on the container, so the page keeps
            the same left gutter as the heading above it and as every other
            section on the site — the same call /legal/privacy makes, and the
            reason this does not read as a centred column floating under a
            left-aligned title.

            680px rather than `max-w-3xl` (768px): a policy is read, not
            skimmed, and 680px at 16px keeps lines near the 65-75 characters
            that stay comfortable for continuous text. */}
        <div className="section-container">
          <DraftBanner path={path} className="mb-10 max-w-prose-wide" />

          <div className="max-w-prose-wide space-y-9 text-step-2 leading-relaxed text-ink-3">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-2.5 text-step-4 font-semibold tracking-tight text-white">
                  {section.heading}
                </h2>

                {Array.isArray(section.body) ? (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.body.map((line) => (
                      <li key={line}>{linkify(line)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{linkify(section.body)}</p>
                )}

                {section.note && (
                  <p className="mt-2.5 text-step-1 leading-relaxed text-ink-3">
                    {linkify(section.note)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {lastUpdated && (
            <Reveal className="mt-12 max-w-prose-wide border-t border-border-subtle pt-6">
              <p className="text-step-1 text-ink-3">Last updated {lastUpdated}.</p>
            </Reveal>
          )}
        </div>
      </section>
    </PageShell>
  );
}
