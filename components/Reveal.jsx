/**
 * Fades + lifts content into view as it enters the viewport.
 *
 * ---------------------------------------------------------------------
 * NO JAVASCRIPT, AND NO `use client`. This was a framer-motion component:
 * `initial={{ opacity: 0 }}` + `whileInView`, which means every element it
 * wrapped was SERVER-RENDERED INVISIBLE and stayed invisible until the
 * framer-motion bundle had downloaded, parsed, hydrated and run an
 * IntersectionObserver.
 *
 * That is a reasonable trade below the fold and a serious one above it. It
 * was measured as the dominant cost on both reviewed routes: the homepage's
 * LCP was 4.9s with 90% render delay, and /shop/iriz 4.7s with 90% render
 * delay on a gallery image that had already downloaded. Nothing was slow —
 * everything was transparent.
 *
 * It is now a SCROLL-DRIVEN CSS ANIMATION (`animation-timeline: view()`), so
 * the reveal is computed by the compositor from the element's own position in
 * the scrollport. No observer, no bundle, no hydration step, and this file is
 * a plain server component.
 *
 * ---------------------------------------------------------------------
 * IT CANNOT HIDE CONTENT. That is the property worth protecting, and it is
 * why the CSS defaults `.reveal` to FULLY VISIBLE and only takes the
 * animation inside `@supports (animation-timeline: view())`. A browser
 * without scroll-driven animations (Firefox and Safari, today) renders the
 * page with no reveal at all rather than a page of blank boxes — which is
 * exactly the failure mode the framer version had whenever its JavaScript was
 * slow, blocked or broken.
 *
 * `prefers-reduced-motion` is handled in the same stylesheet and drops the
 * animation outright. It used to be handled by <MotionConfig reducedMotion
 * ="user"> in app/layout.jsx, which only ever governed framer elements.
 *
 * ---------------------------------------------------------------------
 * PROPS. `delay`, `y` and `scale` all still work and still mean what they
 * meant, so no call site needed changing: they are passed down as custom
 * properties and consumed by the keyframes.
 *
 * `once` and `amount` are ACCEPTED AND IGNORED, deliberately. They were
 * framer viewport options with no equivalent in a timeline that is a pure
 * function of scroll position. `amount` is now fixed by the animation range
 * in CSS, and `once` is close to how the range already behaves: the reveal
 * completes before the element is fully on screen and the `both` fill holds
 * it there, so scrolling down never plays it backwards. Scrolling back UP
 * does re-run it, which framer's `once` would not have — the one real
 * behavioural difference, and a better one on a long page.
 *
 * They are destructured rather than left in `...rest` because they would
 * otherwise land on the DOM node as invalid attributes.
 */
export default function Reveal({
  children,
  className = '',
  style,
  delay = 0,
  y = 28,
  scale,
  // Accepted for call-site compatibility; see the note above.
  once,
  amount,
  as: Tag = 'div',
  // Anything else (event handlers, aria-*, id) passes straight through, so
  // callers don't need an extra wrapper just to attach one.
  ...rest
}) {
  return (
    <Tag
      className={`reveal ${className}`}
      style={{
        '--reveal-y': `${y}px`,
        ...(scale === undefined ? null : { '--reveal-scale': scale }),
        // A stagger, expressed as a shift in where the element's animation
        // range begins rather than as a time. `delay` arrives in seconds on
        // every existing call site (0.08, 0.1, 0.25); 40% of the viewport
        // height per second is the factor that makes the old sequence land
        // at roughly the same visual spacing.
        ...(delay ? { '--reveal-delay': `${Math.round(delay * 40)}%` } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
