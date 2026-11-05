'use client';

import { useEffect, useRef } from 'react';

/**
 * ===========================================================================
 * THE NEURON NETWORK — the hero's canvas backdrop
 * ===========================================================================
 *
 * Blue nodes drifting over the hero's black ground, joined by lines wherever
 * two of them come within LINK_DISTANCE of each other, with a bright "signal"
 * travelling every so often from a random node into the projector's lens.
 *
 * It is the brand argument made visible — BluNeuron, a network, firing into
 * the glass — and it is DECORATION. `aria-hidden` plus `pointer-events: none`
 * (`.hero-network`, app/globals.css) is the whole of its contract with the
 * accessibility tree: it is pruned from it, it cannot be focused, and it
 * cannot swallow a click meant for the buy button over it.
 *
 * ---------------------------------------------------------------------------
 * IT MUST NEVER COST THE PAGE ITS LCP, SO IT DOES NOT RUN DURING LOAD
 * ---------------------------------------------------------------------------
 * The hero's largest paint is a 53 KB WebP photograph (components/Hero,
 * lib/hero-image), and the entire reason the previous rebuild got rid of the
 * <video> hero was that decorative motion was being charged to the page's
 * first screen. This component is not allowed to repeat that, so NOTHING here
 * runs until the page has finished loading:
 *
 *   1. `document.readyState === 'complete'` is waited for (via the `load`
 *      event when it has not happened yet), so no setup competes with the
 *      image request or with hydration;
 *   2. then `requestIdleCallback` — with a `setTimeout` fallback for Safari,
 *      which still does not ship it — so even the node-building loop lands in
 *      a gap rather than on top of whatever the main thread is doing.
 *
 * The canvas itself is SERVER-RENDERED EMPTY and starts transparent through a
 * CLASS, never an inline `style`: scripts/assert-visible-html.mjs fails any
 * route whose markup carries `style="opacity:0"`, and it is right to — that is
 * how the old framer-motion reveals shipped a blank page to browsers that
 * never ran the bundle. `.hero-network` holds the opacity and `.is-live`,
 * added from here, transitions it to 1 over 1.2s. A <canvas> is not an LCP
 * candidate in any engine, so that ramp cannot be credited as the page's
 * largest paint the way the card's old fade was.
 *
 * ---------------------------------------------------------------------------
 * AND IT STOPS WHENEVER NOBODY IS LOOKING
 * ---------------------------------------------------------------------------
 * Three independent brakes, because a decorative rAF loop that keeps running
 * is a battery bug on a phone:
 *
 *   IntersectionObserver   the loop is cancelled once the hero scrolls off
 *                          screen and restarted when it comes back. The page
 *                          is long; the hero is on screen for a fraction of
 *                          it.
 *   visibilitychange       cancelled while the tab is hidden. A background
 *                          tab's rAF is already throttled by the browser, but
 *                          throttled is not stopped.
 *   reduced motion / low power
 *                          never starts at all — see below.
 *
 * ---------------------------------------------------------------------------
 * TWO STATIC MODES, AND THEY DRAW THE SAME PICTURE
 * ---------------------------------------------------------------------------
 * `prefers-reduced-motion: reduce`, `hardwareConcurrency <= 4` and
 * `connection.saveData` all resolve to ONE frame drawn once and no loop: the
 * network is there, it just does not move, and no signals fire. That is a
 * deliberate choice over rendering nothing — the still frame is the same
 * composition, so the layout, the contrast and the design read identically on
 * a four-core phone, on Data Saver and for a reader who has asked the
 * platform for less motion.
 *
 * The three are not the same thing and are kept apart on purpose: reduced
 * motion ALSO turns off the headline shimmer, the ring pulse and the cursor
 * tilt (the first two in CSS, the third below), because those are a stated
 * preference about motion. Low power only stops this canvas, which is the
 * only thing on the page with a per-frame cost.
 *
 * ---------------------------------------------------------------------------
 * THE SIGNAL TARGET IS READ OFF THE PAGE, NOT CONFIGURED HERE
 * ---------------------------------------------------------------------------
 * Signals aim at `[data-hero-lens]` — the glow element components/Hero places
 * from `HERO_IMAGE.lens`, which `npm run hero:image` measures out of the
 * photograph. So a new hero photo moves the lens, the glow and the signals'
 * destination together, with nothing here to update and no second copy of the
 * coordinate to drift.
 *
 * `HERO_IMAGE.lens === null` is a supported state in that file (the script
 * writes null when it cannot find the glass with confidence), and Hero then
 * renders no glow element at all. This falls back to `[data-hero-card]`'s
 * centre, which is the product, so the signals still arrive somewhere
 * meaningful rather than at a guessed percentage.
 */

/* --------------------------------------------------------------------- *
 * TUNING. Every number here is either a measured budget or a colour from
 * the hero's palette.
 * --------------------------------------------------------------------- */

/**
 * One node per this many CSS px² of hero.
 *
 * 19k, not 26k, and the difference is whether this reads as a NETWORK or as
 * scattered dots. Links only draw between nodes closer than LINK_DISTANCE, so
 * density and that radius have to be chosen together: at 26k the mean spacing
 * on a 1440-wide hero was ~160px, just past the 150px radius, and the field
 * came out as 69 unconnected specks. 19k puts a full-height desktop hero on
 * the 90-node cap, where the mean spacing is ~140px and most nodes have two
 * or three neighbours.
 *
 * The caps below are what bound the cost, so lowering this number cannot make
 * a frame more expensive than a capped one already is — it only decides how
 * small a viewport still reaches the cap.
 */
const AREA_PER_NODE = 19000;

/**
 * The caps, and they are caps rather than fixed counts because the cost of a
 * frame is O(n²) in the link pass: 90 nodes is 4,005 pairs, which measures
 * well inside a frame, and 180 would be 16,110, which does not.
 */
const MAX_NODES_DESKTOP = 90;
const MAX_NODES_MOBILE = 35;
/** Below this width the layout is one column and the mobile cap applies. */
const MOBILE_WIDTH = 700;
/** Enough to read as a network at any size. */
const MIN_NODES = 14;

/** Nodes nearer than this are joined. Line alpha fades to 0 at the edge. */
const LINK_DISTANCE = 150;
/** Peak line alpha, at zero separation. */
const LINK_ALPHA = 0.22;

/** Nodes within this of the cursor brighten. */
const CURSOR_RADIUS = 180;

/** The palette, written once. */
const NODE_RGB = '120, 170, 255';
const LINK_RGB = '91, 157, 255';

/**
 * Node alpha at rest, and the brightest a node gets under the cursor.
 *
 * 0.55 IS A CONTRAST BUDGET, not only a look. White type sits over this
 * field, and a node dot directly behind a glyph raises the local background:
 * measured, `text-white/70` over a 0.55 node on #030303 is 4.14:1, which is
 * under AA for small text. Two things keep the page clear of that — the
 * canvas is masked down over the left column where the copy is, and the
 * mobile field (where the copy is over the whole canvas) runs at
 * NODE_ALPHA_MOBILE. See `.hero-network` in app/globals.css.
 */
const NODE_ALPHA = 0.55;
const NODE_ALPHA_MOBILE = 0.4;
const NODE_ALPHA_HOT = 0.95;

/**
 * Drift, in CSS px per second. Slow enough that the field reads as breathing
 * rather than as falling snow; the mobile field is slower again.
 */
const DRIFT = 7.5;
const DRIFT_MOBILE = 4.5;

/** Device pixel ratio is capped here. Past 2 the extra pixels are invisible
    and the fill cost is not. */
const MAX_DPR = 2;

/** Seconds between signals, picked uniformly in this range. */
const SIGNAL_GAP_MIN = 1.4;
const SIGNAL_GAP_MAX = 3.2;
/** Seconds a signal takes to reach the lens. */
const SIGNAL_TRAVEL = 1.25;
/** More than one in flight reads as traffic rather than as a twitch. */
const MAX_SIGNALS = 3;

/** Degrees of card tilt at the far corner of the hero. */
const TILT_MAX = 8;

export default function NeuronNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    // The hero <section>. The canvas is one of its positioned children, so
    // the section is both the box to fill and the element to observe.
    const section = canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!section || !ctx) return undefined;

    /* ---------------------------------------------------------------- *
     * WHAT THIS DEVICE AND THIS READER HAVE ASKED FOR
     * ---------------------------------------------------------------- */
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // BOTH halves, and that is the point of the query rather than a width
    // test: a touch screen reports neither, a trackpad reports both, and a
    // stylus reports a fine pointer with no hover. Tilt and cursor-glow are
    // for a real pointer only.
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    // `saveData` and `hardwareConcurrency` are both optional and both absent
    // on some engines, so each is read defensively — a missing value means
    // "no reason to think this device is constrained", not "constrained".
    const lowPower = (
      typeof navigator.hardwareConcurrency === 'number'
      && navigator.hardwareConcurrency > 0
      && navigator.hardwareConcurrency <= 4
    ) || (navigator.connection && navigator.connection.saveData === true);

    /* ---------------------------------------------------------------- *
     * STATE. Declared out here so every handler below closes over the
     * same objects and the cleanup can reach all of it.
     * ---------------------------------------------------------------- */
    let nodes = [];
    let builtMobile = null;
    let signals = [];
    let width = 0;
    let height = 0;
    let mobile = false;
    let frame = 0;
    let lastTime = 0;
    let nextSignal = 0;
    let onScreen = true;
    let started = false;
    let disposed = false;
    const pointer = { x: 0, y: 0, active: false };
    const target = { x: 0, y: 0 };

    /** Where the signals are flying to — the lens, or the card. See the note
        at the top of this file: the coordinate is read off the page so a new
        hero photograph moves it with no edit here. */
    function measureTarget() {
      const base = section.getBoundingClientRect();
      const el = section.querySelector('[data-hero-lens]')
        || section.querySelector('[data-hero-card]');
      if (!el) {
        // Neither present is not a state this page can reach, but a canvas
        // aiming at NaN would paint nothing at all, so it lands where the
        // card lives instead.
        target.x = base.width * 0.72;
        target.y = base.height * 0.5;
        return;
      }
      const r = el.getBoundingClientRect();
      target.x = r.left - base.left + r.width / 2;
      target.y = r.top - base.top + r.height / 2;
    }

    function buildNodes() {
      const count = Math.max(
        MIN_NODES,
        Math.min(
          mobile ? MAX_NODES_MOBILE : MAX_NODES_DESKTOP,
          Math.round((width * height) / AREA_PER_NODE),
        ),
      );
      const speed = mobile ? DRIFT_MOBILE : DRIFT;
      nodes = [];
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        // 0.45-1 of the nominal speed, so the field has depth instead of
        // every dot moving at one rate.
        const rate = speed * (0.45 + Math.random() * 0.55);
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * rate,
          vy: Math.sin(angle) * rate,
          // 1-2.1px. Varied, so the field has near and far nodes.
          r: 1 + Math.random() * 1.1,
        });
      }
      builtMobile = mobile;
    }

    /** Lay out the canvas's backing store for the section's current box. */
    function resize() {
      const rect = section.getBoundingClientRect();
      const nextW = Math.round(rect.width);
      const nextH = Math.round(rect.height);
      if (nextW === width && nextH === height) return false;

      const had = width > 0 && height > 0;
      const sx = had ? nextW / width : 1;
      const sy = had ? nextH / height : 1;

      width = nextW;
      height = nextH;
      mobile = width < MOBILE_WIDTH;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      // One transform, set once per resize: every coordinate below is in CSS
      // pixels and the context does the scaling.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!had || mobile !== builtMobile) {
        buildNodes();
      } else {
        // SCALED, not rebuilt. A rebuild on every resize step makes a window
        // drag look like the field is being reshuffled; scaling keeps the
        // same nodes in the same relative places.
        for (let i = 0; i < nodes.length; i += 1) {
          nodes[i].x *= sx;
          nodes[i].y *= sy;
        }
      }
      measureTarget();
      return true;
    }

    /* ---------------------------------------------------------------- *
     * DRAWING. One function, called by the loop and also called once on
     * its own in the two static modes.
     * ---------------------------------------------------------------- */
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const restAlpha = mobile ? NODE_ALPHA_MOBILE : NODE_ALPHA;

      // LINES FIRST, so nodes sit on top of their own connections. This pass
      // is the O(n²) half of the frame and is the reason for the node caps;
      // `j` starts at `i + 1`, so each pair is considered once.
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          // SQUARED distance against a squared threshold: the square root is
          // the most expensive operation in the frame, and most pairs fail
          // the test anyway, so it is only taken for the ones that pass.
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DISTANCE * LINK_DISTANCE) continue;
          const alpha = LINK_ALPHA * (1 - Math.sqrt(d2) / LINK_DISTANCE);
          ctx.strokeStyle = 'rgba(' + LINK_RGB + ', ' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        let alpha = restAlpha;
        let radius = n.r;
        if (pointer.active) {
          const dx = n.x - pointer.x;
          const dy = n.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CURSOR_RADIUS * CURSOR_RADIUS) {
            // Linear in distance, which is the falloff that reads as a light
            // being carried over the field rather than as a hard edge.
            const t = 1 - Math.sqrt(d2) / CURSOR_RADIUS;
            alpha += (NODE_ALPHA_HOT - alpha) * t;
            radius += 0.9 * t;
          }
        }
        ctx.fillStyle = 'rgba(' + NODE_RGB + ', ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // THE SIGNALS, last and brightest. A short trail behind the head, so
      // the eye reads a direction of travel off a 2px dot.
      for (let i = 0; i < signals.length; i += 1) {
        const s = signals[i];
        const x = s.x0 + (target.x - s.x0) * s.t;
        const y = s.y0 + (target.y - s.y0) * s.t;
        // Fades in over the first 15% and out over the last 25%, so a signal
        // never appears or vanishes as a hard dot.
        const fade = Math.min(1, s.t / 0.15, (1 - s.t) / 0.25);
        const tail = Math.max(0, s.t - 0.06);
        const tx = s.x0 + (target.x - s.x0) * tail;
        const ty = s.y0 + (target.y - s.y0) * tail;

        ctx.strokeStyle = 'rgba(190, 220, 255, ' + (0.5 * fade).toFixed(3) + ')';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(226, 240, 255, ' + (0.95 * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 1;
    }

    function spawnSignal() {
      if (!nodes.length || signals.length >= MAX_SIGNALS) return;
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      signals.push({ x0: n.x, y0: n.y, t: 0 });
    }

    /* ---------------------------------------------------------------- *
     * THE LOOP. `dt` is seconds and is CLAMPED: a tab that was throttled
     * or a machine that stalled hands back a delta of whole seconds, and
     * integrating that would teleport every node across the viewport in
     * a single frame.
     * ---------------------------------------------------------------- */
    function tick(now) {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        // WRAPPED, not bounced. A bounce puts a visible hard edge around the
        // field; a wrap keeps it unbounded. The margin is one node radius
        // plus slack, so nothing pops at the boundary.
        if (n.x < -8) n.x += width + 16;
        else if (n.x > width + 8) n.x -= width + 16;
        if (n.y < -8) n.y += height + 16;
        else if (n.y > height + 8) n.y -= height + 16;
      }

      nextSignal -= dt;
      if (nextSignal <= 0) {
        spawnSignal();
        nextSignal = SIGNAL_GAP_MIN + Math.random() * (SIGNAL_GAP_MAX - SIGNAL_GAP_MIN);
      }
      for (let i = 0; i < signals.length; i += 1) signals[i].t += dt / SIGNAL_TRAVEL;
      if (signals.length && signals[0].t >= 1) {
        signals = signals.filter((s) => s.t < 1);
      }

      draw();
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }

    /** Running is the conjunction of every brake, so each handler below can
        just call this instead of reasoning about the others. */
    function sync() {
      if (disposed || !started) return;
      const should = onScreen && !document.hidden && !reduceQuery.matches && !lowPower;
      if (should) {
        if (!frame) frame = requestAnimationFrame(tick);
      } else {
        stop();
        // The static modes still want their one frame, and a hero that
        // scrolled away mid-animation should not come back blank.
        draw();
      }
    }

    /* ---------------------------------------------------------------- *
     * THE CARD TILT. It lives here rather than in a component of its own
     * because this is already the only thing on the page tracking the
     * cursor, and a second listener for the same event would be a second
     * cost for the same information.
     *
     * It writes two CUSTOM PROPERTIES and never a `transform`, so the
     * card's own rule owns the composition (see `.hero-card` in
     * app/globals.css) and this cannot overwrite the entrance animation.
     * ---------------------------------------------------------------- */
    const card = section.querySelector('[data-hero-card]');

    function setTilt(x, y) {
      if (!card) return;
      card.style.setProperty('--tilt-x', x.toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', y.toFixed(2) + 'deg');
    }

    function clearTilt() {
      if (!card) return;
      card.style.setProperty('--tilt-lift', '0');
      setTilt(0, 0);
    }

    function onPointerMove(event) {
      const rect = section.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      if (!reduceQuery.matches && card) {
        // -1..1 from the centre of the hero. rotateY follows the horizontal
        // axis and rotateX the vertical, INVERTED, which is what makes the
        // card lean toward the cursor rather than away from it.
        const nx = (pointer.x / rect.width) * 2 - 1;
        const ny = (pointer.y / rect.height) * 2 - 1;
        card.style.setProperty('--tilt-lift', '1');
        setTilt(-ny * TILT_MAX, nx * TILT_MAX);
      }
    }

    function onPointerLeave() {
      pointer.active = false;
      clearTilt();
    }

    /* ---------------------------------------------------------------- *
     * WIRING, and nothing above runs until start() does.
     * ---------------------------------------------------------------- */
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        sync();
      },
      // A margin, so the loop is already running by the time the hero is
      // actually back on screen rather than starting on its first pixel.
      { rootMargin: '120px' },
    );

    let resizeFrame = 0;
    function onResize() {
      // Coalesced into one frame: a window drag fires this continuously and
      // re-laying out the backing store per event is the expensive half.
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (disposed) return;
        if (resize() && !frame) draw();
      });
    }

    function onVisibility() {
      sync();
    }

    function onPreferenceChange() {
      if (reduceQuery.matches) {
        clearTilt();
        signals = [];
      }
      sync();
    }

    function start() {
      if (disposed) return;
      started = true;
      resize();
      // The 1.2s ramp. A class, not an inline style — see the note at the
      // top of this file about assert-visible-html.
      canvas.classList.add('is-live');

      if (reduceQuery.matches || lowPower) {
        // ONE FRAME, no loop. The composition is there; it does not move.
        draw();
      } else {
        nextSignal = SIGNAL_GAP_MIN + Math.random() * (SIGNAL_GAP_MAX - SIGNAL_GAP_MIN);
        sync();
      }

      observer.observe(section);
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      if (pointerQuery.matches) {
        // On the SECTION, not the window: the cursor glow and the tilt are
        // both about where the pointer is inside the hero, and a listener on
        // the window would keep firing for the whole of a long page.
        section.addEventListener('pointermove', onPointerMove, { passive: true });
        section.addEventListener('pointerleave', onPointerLeave, { passive: true });
      }
      reduceQuery.addEventListener('change', onPreferenceChange);
    }

    /* ---------------------------------------------------------------- *
     * THE DEFERRAL. Load first, then idle. See the note at the top.
     * ---------------------------------------------------------------- */
    let idleHandle = 0;
    let timeoutHandle = 0;

    function whenIdle() {
      if (disposed) return;
      if (typeof window.requestIdleCallback === 'function') {
        // The timeout is a CEILING, not a target: a main thread that stays
        // busy would otherwise never hand over an idle period and the
        // network would simply never appear.
        idleHandle = window.requestIdleCallback(start, { timeout: 1200 });
      } else {
        timeoutHandle = window.setTimeout(start, 200);
      }
    }

    if (document.readyState === 'complete') {
      whenIdle();
    } else {
      window.addEventListener('load', whenIdle, { once: true });
    }

    return () => {
      disposed = true;
      stop();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      if (idleHandle && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) clearTimeout(timeoutHandle);
      observer.disconnect();
      window.removeEventListener('load', whenIdle);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      reduceQuery.removeEventListener('change', onPreferenceChange);
      clearTilt();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // DECORATION, and the two attributes that say so. `aria-hidden` prunes
      // it from the accessibility tree; `pointer-events: none` lives in
      // `.hero-network` so it cannot intercept a click meant for the buy
      // button that sits over it.
      aria-hidden="true"
      className="hero-network"
    />
  );
}
