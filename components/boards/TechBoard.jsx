import CountUp from '../CountUp';

/**
 * The two "Under the Hood" boards, as live type.
 *
 * SPEC BOARD. The artwork's seven figures become a real <dl>. That is the
 * material difference: a definition list is a spec table to a screen reader,
 * to a translation layer and to a search engine, where the PNG was an opaque
 * rectangle with a 60-word `alt` string doing its best. Every row also now
 * sits in FULL_SPEC_SHEET (lib/iriz.js) — so the board and the full sheet on
 * /specs cannot drift the way a picture and a table can.
 *
 * LATENCY BOARD. The 0.004s figure counts up (components/CountUp, which
 * renders the real value server-side and only animates once it is on screen,
 * and not at all under prefers-reduced-motion). The 2s it was set against is
 * kept and labelled "Typical lag" rather than attributed to a competitor by
 * picture — the artwork made the comparison with a blurred frame of someone
 * else's game art.
 */

export function SpecBoard({ board, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className="tech-board">
      <div className="tech-board-head">
        <Heading className="tech-board-title">{board.headline}</Heading>
        <p className="tech-board-sub">{board.subhead}</p>
      </div>

      <dl className="spec-rows">
        {board.rows.map((row) => (
          <div key={row.label} className="spec-row">
            <dt className="spec-row-label">{row.label}</dt>
            <dd className="spec-row-value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function LatencyBoard({ board, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className="tech-board tech-board-latency">
      <Heading className="tech-board-title">{board.headline}</Heading>

      <div className="latency-figure">
        <div className="latency-primary">
          <CountUp value={board.value} className="latency-value" />
          <p className="latency-label">{board.valueLabel}</p>
        </div>

        {/* The bar pair carries the comparison visually; both numbers are
            stated in type either side of it, so the bars are decorative. */}
        <div aria-hidden="true" className="latency-bars">
          <span className="latency-bar latency-bar-fast" />
          <span className="latency-bar latency-bar-slow" />
        </div>

        <div className="latency-against">
          <p className="latency-against-value">{board.against.value}</p>
          <p className="latency-label">{board.against.label}</p>
        </div>
      </div>
    </article>
  );
}
