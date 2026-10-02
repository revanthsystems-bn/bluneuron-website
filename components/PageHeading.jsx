import Reveal from './Reveal';

export default function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="border-b border-border-subtle bg-black py-16 sm:py-20">
      <div className="section-container">
        <Reveal>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="max-w-2xl text-4xl font-bold tracking-tighter text-white sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-xl text-base text-white/55">{subtitle}</p>}
        </Reveal>
      </div>
    </div>
  );
}
