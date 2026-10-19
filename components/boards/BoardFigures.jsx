import { SCREEN_LADDER } from '@/lib/iriz';

/**
 * The diagrams that stand in for the deleted listing artwork.
 *
 * ALL OF THEM ARE SVG, INLINE, AND DECORATIVE. Inline because each one is a
 * few hundred bytes of geometry and an <img> would be a second request for
 * something the server is already sending; decorative because every word they
 * once carried is now real type in the board beside them — so they are
 * `aria-hidden` and carry no title, and a screen reader hears the board's
 * heading and figures rather than a transcription of a picture.
 *
 * NO PRODUCT IS DRAWN IN ANY OF THEM. The supplied artwork pictured a
 * projector whose shell is not the shell that ships, in rooms we do not own,
 * against films we have no licence to. These draw the GEOMETRY of the claim —
 * a screen ladder, a keystone correction, a die, a wavefront — which is the
 * part that is actually ours to state.
 *
 * `currentColor` throughout, so a figure inherits the tile's own text colour
 * and there is no second palette to keep in sync with app/globals.css.
 */

/** Shared: the faint grid every figure sits on, so they read as one family. */
function FigureFrame({ children, viewBox, className = '' }) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      className={`board-figure ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/**
 * The chipset die: concentric rounded squares with pin traces running off
 * all four edges, and the package's own corner notch.
 */
export function ChipsetFigure() {
  const pins = [0, 1, 2, 3, 4, 5];
  return (
    <FigureFrame viewBox="0 0 200 200">
      {/* Traces, drawn first so the die sits on top of them. */}
      <g stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round">
        {pins.map((i) => {
          const at = 62 + i * 15.2;
          return (
            <g key={i}>
              <path d={`M${at} 46 V18`} />
              <path d={`M${at} 154 V182`} />
              <path d={`M46 ${at} H18`} />
              <path d={`M154 ${at} H182`} />
            </g>
          );
        })}
      </g>

      {/* Package. */}
      <rect
        x="46"
        y="46"
        width="108"
        height="108"
        rx="12"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      {/* Die. */}
      <rect
        x="68"
        y="68"
        width="64"
        height="64"
        rx="6"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="2"
      />
      {/* Four cores — the "quad-core" the sub-head states, drawn rather than
          labelled, because the label is already in the type beside this. */}
      <g fill="currentColor" fillOpacity="0.5">
        <rect x="78" y="78" width="18" height="18" rx="3" />
        <rect x="104" y="78" width="18" height="18" rx="3" />
        <rect x="78" y="104" width="18" height="18" rx="3" />
        <rect x="104" y="104" width="18" height="18" rx="3" />
      </g>
      {/* Pin-1 notch. */}
      <circle cx="57" cy="57" r="3.5" fill="currentColor" fillOpacity="0.7" />
    </FigureFrame>
  );
}

/**
 * The screen ladder: nested 16:9 rectangles stepping back, with each step's
 * diagonal and its throw distance labelled.
 *
 * Geometry comes from SCREEN_LADDER (lib/iriz.js), which is derived from
 * THROW_RANGE rather than transcribed off the artwork — so the picture cannot
 * disagree with the spec table. Each rectangle's width is proportional to its
 * diagonal, which is what makes the steps read as the same room at three
 * distances rather than three arbitrary boxes.
 */
export function ScreenFigure() {
  const max = SCREEN_LADDER[SCREEN_LADDER.length - 1].size;
  const W = 260;
  const H = 180;

  return (
    <FigureFrame viewBox={`0 0 ${W} ${H}`} className="board-figure-wide">
      {/* Largest first, so the smaller screens paint over it. */}
      {[...SCREEN_LADDER].reverse().map((step, i) => {
        const scale = step.size / max;
        const w = 196 * scale;
        const h = w * (9 / 16);
        // Anchored bottom-left: the stack grows up and to the right, which is
        // how a throw actually opens out from the lens.
        const x = 16;
        const y = 126 - h;
        const strong = i === 0;
        return (
          <g key={step.size}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="3"
              stroke="currentColor"
              strokeOpacity={strong ? 0.75 : 0.35}
              strokeWidth={strong ? 2 : 1.5}
              fill="currentColor"
              fillOpacity={strong ? 0.05 : 0.08}
            />
            <text
              x={x + w - 6}
              y={y + 15}
              textAnchor="end"
              fill="currentColor"
              fillOpacity={strong ? 0.9 : 0.55}
              fontSize="11"
              fontWeight="600"
            >
              {step.size}&#8243;
            </text>
          </g>
        );
      })}

      {/* Distance axis under the stack. */}
      <path
        d={`M16 140 H${16 + 196}`}
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {SCREEN_LADDER.map((step) => {
        const x = 16 + 196 * (step.size / max);
        return (
          <g key={step.distance}>
            <path
              d={`M${x} 135 V145`}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={160}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.6"
              fontSize="10.5"
            >
              {step.distance}m
            </text>
          </g>
        );
      })}
    </FigureFrame>
  );
}

/**
 * Keystone: the off-axis quad the projector actually throws (dashed), and the
 * square it is corrected to (solid), with a marker on each of the four
 * corners that get pulled. "4pt Auto Keystone" is what the retail box calls
 * it; four corners is what the picture shows.
 */
export function KeystoneFigure() {
  return (
    <FigureFrame viewBox="0 0 220 150">
      {/* The uncorrected throw. */}
      <path
        d="M34 26 L196 44 L196 120 L34 132 Z"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      {/* The corrected picture. */}
      <rect
        x="52"
        y="38"
        width="128"
        height="76"
        rx="3"
        stroke="currentColor"
        strokeOpacity="0.8"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* The four handles, on the corrected corners. */}
      <g fill="currentColor" fillOpacity="0.9">
        <circle cx="52" cy="38" r="4" />
        <circle cx="180" cy="38" r="4" />
        <circle cx="52" cy="114" r="4" />
        <circle cx="180" cy="114" r="4" />
      </g>
      {/* The pull, from skewed corner to square corner. */}
      <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round">
        <path d="M34 26 L52 38" />
        <path d="M196 44 L180 38" />
        <path d="M34 132 L52 114" />
        <path d="M196 120 L180 114" />
      </g>
    </FigureFrame>
  );
}

/** The 5W speaker's wavefront — concentric arcs off both flanks. */
export function SpeakerFigure() {
  const arcs = [0, 1, 2];
  return (
    <FigureFrame viewBox="0 0 220 120">
      <rect
        x="86"
        y="42"
        width="48"
        height="36"
        rx="7"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.07"
      />
      {arcs.map((i) => {
        const r = 22 + i * 18;
        return (
          <g key={i} stroke="currentColor" strokeOpacity={0.5 - i * 0.13} strokeWidth="2" strokeLinecap="round">
            <path d={`M${80 - i * 18} ${60 - r * 0.55} A ${r} ${r} 0 0 0 ${80 - i * 18} ${60 + r * 0.55}`} />
            <path d={`M${140 + i * 18} ${60 - r * 0.55} A ${r} ${r} 0 0 1 ${140 + i * 18} ${60 + r * 0.55}`} />
          </g>
        );
      })}
    </FigureFrame>
  );
}

/** Figures by the `figure` key in HIGHLIGHT_BOARDS. */
export const FIGURES = {
  chipset: ChipsetFigure,
  screen: ScreenFigure,
  keystone: KeystoneFigure,
  speaker: SpeakerFigure,
};
