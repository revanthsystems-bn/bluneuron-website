import { FIGURES } from './BoardFigures';

/**
 * One "What You Get" board, as live type.
 *
 * WHAT THIS REPLACES. A 750-1014px PNG with its headline, sub-head, badge and
 * callout strip burned into the pixels, shown at tile scale. On a 390px phone
 * that artwork's own body type landed at roughly 8px on screen, which is why
 * the mobile presentation was a carousel of pictures to pinch rather than a
 * set of claims to read. The words are identical (lib/iriz.js records the
 * three figures that were corrected against the retail box); the difference
 * is that they are now type, so they re-flow, scale with the reader's own
 * font size, and are selectable, translatable and announceable.
 *
 * A SERVER COMPONENT, and that is the point of the exercise as much as the
 * typography is: this is the whole homepage board row rendered with no
 * client JavaScript at all, where it used to be a client carousel plus four
 * lazily-fetched images.
 *
 * The heading level is passed in rather than fixed. These sit under the
 * section's own <h2>, so they are <h3>s on the homepage — but the component
 * must not assume that, because a board moved under a different heading would
 * silently break the document outline.
 */
export default function HighlightBoard({ board, headingLevel = 3 }) {
  const Figure = FIGURES[board.figure];
  const Heading = `h${headingLevel}`;

  return (
    <article className="board">
      <div className="board-head">
        <p className="eyebrow">{board.eyebrow}</p>
        <Heading className="board-title">{board.headline}</Heading>
        {board.subhead ? <p className="board-sub">{board.subhead}</p> : null}
        {board.badge ? <p className="board-badge">{board.badge}</p> : null}
      </div>

      {Figure ? (
        <div className="board-figure-box">
          <Figure />
        </div>
      ) : null}

      {board.callouts?.length ? (
        <ul className="board-callouts">
          {board.callouts.map((c) => (
            <li key={c.title} className="board-callout">
              {/* Always rendered, even when there is no figure: the empty
                  slot is what keeps all four callout titles on one baseline.
                  See `.board-callout-value` in app/globals.css. */}
              <span className="board-callout-value">{c.value ?? ''}</span>
              <span className="board-callout-title">{c.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
