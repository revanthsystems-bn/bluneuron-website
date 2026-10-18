import Reveal from './Reveal';

export default function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="border-b border-border-subtle bg-black section-y">
      <div className="section-container">
        <Reveal>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="h2 max-w-prose-wide">{title}</h1>
          {subtitle && <p className="mt-4 max-w-prose text-step-3 text-ink-3">{subtitle}</p>}
        </Reveal>
      </div>
    </div>
  );
}
