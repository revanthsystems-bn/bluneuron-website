import PageShell from './PageShell';
import PageHeading from './PageHeading';
import DraftBanner from './DraftBanner';
import Reveal from './Reveal';

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

      <section className="bg-black py-16 sm:py-20">
        {/* `max-w-[680px]` on the PROSE, not on the container, so the page keeps
            the same left gutter as the heading above it and as every other
            section on the site — the same call /legal/privacy makes, and the
            reason this does not read as a centred column floating under a
            left-aligned title.

            680px rather than `max-w-3xl` (768px): a policy is read, not
            skimmed, and 680px at 16px keeps lines near the 65-75 characters
            that stay comfortable for continuous text. */}
        <div className="section-container">
          <DraftBanner path={path} className="mb-10 max-w-[680px]" />

          <div className="max-w-[680px] space-y-9 text-sm leading-relaxed text-white/65">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-2.5 text-lg font-semibold tracking-tight text-white">
                  {section.heading}
                </h2>

                {Array.isArray(section.body) ? (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.body.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{section.body}</p>
                )}

                {section.note && (
                  <p className="mt-2.5 text-xs leading-relaxed text-white/40">{section.note}</p>
                )}
              </div>
            ))}
          </div>

          {lastUpdated && (
            <Reveal className="mt-12 max-w-[680px] border-t border-border-subtle pt-6">
              <p className="text-xs text-white/40">Last updated {lastUpdated}.</p>
            </Reveal>
          )}
        </div>
      </section>
    </PageShell>
  );
}
