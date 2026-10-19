import { SpeakerFigure } from './BoardFigures';

/**
 * One of the two wide banners, as live type.
 *
 * These were the heaviest two files on the site — 1.8MB and 1.9MB of PNG, a
 * combined 3.7MB to say eleven short sentences. Both are now markup.
 *
 * TWO SHAPES, ONE COMPONENT. The brightness banner carries a 1080P/720P
 * comparison; the speaker banner carries a wavefront. Each is a different
 * `figure` branch and everything around it — eyebrow, headline, sub-head,
 * callout strip — is shared, because that part was identical in both pieces
 * of artwork and should not become two implementations now that it is code.
 *
 * THE BRIGHTNESS COMPARISON IS NOT A PHOTOGRAPH ANY MORE. The artwork made
 * its point with the same strawberry shot twice, once dimmed — a stock image
 * we have no licence for, making a claim about our own hardware that a stock
 * image cannot support. The same point is made here with the two panels
 * themselves: one at full brightness and contrast, one flattened. It states
 * the difference without pretending to be a measurement of it.
 */
export default function HighlightBanner({ banner, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;

  return (
    <article className="banner">
      <div className="banner-copy">
        <p className="eyebrow">{banner.eyebrow}</p>
        <Heading className="banner-title">{banner.headline}</Heading>
        <p className="banner-sub">{banner.subhead}</p>
        {banner.body ? <p className="banner-body">{banner.body}</p> : null}
      </div>

      <div className="banner-figure">
        {banner.compare ? (
          <div className="banner-compare">
            {[
              ['good', banner.compare.good],
              ['bad', banner.compare.bad],
            ].map(([kind, panel]) => (
              <figure key={kind} className={`compare-panel compare-panel-${kind}`}>
                {/* Decorative: the panel IS the illustration. Its label and
                    caption below are the content and are real text. */}
                <span aria-hidden="true" className="compare-swatch" />
                <span className="compare-label">{panel.label}</span>
                <figcaption className="compare-caption">{panel.caption}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <SpeakerFigure />
        )}
      </div>

      <ul className={`banner-callouts${banner.callouts.length === 3 ? ' banner-callouts-3' : ''}`}>
        {banner.callouts.map((c) => (
          <li key={c.title} className="banner-callout">
            <span className="banner-callout-title">{c.title}</span>
            {c.body ? <span className="banner-callout-body">{c.body}</span> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}
