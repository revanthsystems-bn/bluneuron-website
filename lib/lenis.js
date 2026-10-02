/**
 * A handle on the one Lenis instance (components/SmoothScroll).
 *
 * Lenis drives `scrollTop` every frame, so `overflow: hidden` on <body> does
 * NOT stop the page moving behind a modal — Lenis simply writes the position
 * back on the next rAF tick. Locking scroll therefore has two halves, and
 * both are required: hide the overflow AND tell Lenis to stand down.
 *
 * A module-level reference rather than a context: the consumer is a scroll
 * lock, which is a document-level concern and has no business being wired
 * through the React tree. Every function here is a no-op when Lenis never
 * mounted (reduced motion, or SSR), so callers never need to check.
 */
let instance = null;

export function setLenis(next) {
  instance = next;
}

export function stopLenis() {
  instance?.stop();
}

export function startLenis() {
  instance?.start();
}
