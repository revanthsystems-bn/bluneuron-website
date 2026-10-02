/**
 * HERO THEME — a reversible light/dark switch for the hero section ONLY.
 *
 * The hero loop is a white-studio shot (see MEDIA.heroLoop in ./iriz.js): the
 * unit held in one hand against a lit white seamless. The dark page has
 * always been fighting that — a flat 0.42 veil plus two gradients exist
 * purely to hold white type over white footage. The LIGHT theme is the
 * opposite bet: drop the veil, let the footage sit near its natural
 * exposure, and set the type in the project's dark ink instead.
 *
 * This is a TEST, not a migration. Everything below the hero stays dark, so
 * the light hero needs a tall gradient blend at its bottom edge to reach the
 * black of the next section without a seam.
 *
 * REVERTING: set HERO_THEME back to 'dark' and the light path is inert —
 * every light-mode style is scoped under `[data-hero-theme='light']` in
 * app/globals.css and nothing in the dark path was modified to make room for
 * it. Deleting this file plus that CSS block and the `theme` props in
 * components/Hero.jsx restores the original exactly.
 */

/** The committed default. Flip to 'light' to make the light hero the build default. */
export const HERO_THEME = 'dark';

export const HERO_THEMES = ['dark', 'light'];

/**
 * `?hero=light` / `?hero=dark` overrides HERO_THEME for one page view, so both
 * versions can be opened side by side without a rebuild.
 *
 * Reads from a plain string rather than `useSearchParams()` on purpose: that
 * hook opts the whole route into client-side rendering unless it is wrapped in
 * a Suspense boundary, and the hero is the page's LCP. Hero.jsx is a server
 * component and reads `searchParams` from the page instead — no hook, no
 * boundary, no change to how the page renders.
 */
export function resolveHeroTheme(param) {
  const value = Array.isArray(param) ? param[0] : param;
  return HERO_THEMES.includes(value) ? value : HERO_THEME;
}
