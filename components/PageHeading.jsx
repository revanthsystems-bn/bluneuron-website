/**
 * The title block at the top of every non-homepage route.
 *
 * NO scroll reveal, deliberately. This is the first thing on the page and it
 * is always above the fold, so there is no "scrolling into view" for it to
 * do — animating it only ever bought a heading that arrives a beat after the
 * page it titles. It is also the one piece of copy that tells a visitor they
 * are in the right place, which is exactly the thing that must never depend
 * on a bundle having landed. See components/Reveal.jsx.
 */
export default function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="border-b border-border-subtle bg-black py-16 sm:py-20">
      <div className="section-container">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-2xl text-4xl font-bold tracking-tighter text-white sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-xl text-base text-white/55">{subtitle}</p>}
      </div>
    </div>
  );
}
