import PageShell from './PageShell';
import PageHeading from './PageHeading';
import Reveal from './Reveal';

export default function LegalPage({ title, sections, draftDate }) {
  return (
    <PageShell>
      <PageHeading eyebrow="Legal" title={title} />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container max-w-3xl">
          <Reveal className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
            <p className="text-sm font-semibold text-amber-300">
              DRAFT — placeholder legal text, not reviewed by counsel. Replace with reviewed legal copy before
              launch.
            </p>
          </Reveal>

          <div className="space-y-8 text-sm leading-relaxed text-white/65">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="mb-2 text-lg font-semibold text-white">{s.heading}</h2>
                {Array.isArray(s.body) ? (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {s.body.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{s.body}</p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-white/50">Draft prepared {draftDate} — not a final or reviewed document.</p>
        </div>
      </section>
    </PageShell>
  );
}
