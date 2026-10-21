/**
 * The scroll-reveal gate, as a string, in a module BOTH ends can read.
 *
 * app/layout.jsx inlines it into <head>; next.config.js hashes it for the
 * Content-Security-Policy. That is the only reason it lives in its own file
 * rather than beside the layout that renders it: a CSP hash has to be taken
 * over the exact bytes that end up in the document, and a second copy of the
 * script typed into the config would go stale the first time one of them was
 * edited — silently, because the symptom is a console report in a policy
 * that is report-only.
 *
 * CommonJS (`module.exports`) on purpose. next.config.js is CJS and cannot
 * `import` from an ESM module; the App Router imports CJS from ESM without
 * complaint, so this direction is the one that works for both.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DOES
 * ---------------------------------------------------------------------------
 * `html.js-anim` is the ONLY thing that hides a <Reveal> (the single css rule
 * in app/globals.css). Nothing in the server-rendered markup is hidden, so
 * everything a visitor came to read is on the page as written and this script
 * opts them in to the animation afterwards — never the other way round.
 *
 * Three ways the class never arrives, all of them leaving a visible page:
 *
 *   1. Scripts do not run (disabled, blocked, CSP, a dead in-app webview).
 *      This script never executes, so the class is never added.
 *   2. prefers-reduced-motion: reduce. Checked here and refused outright, so
 *      there is no animation to sit through rather than a faster one.
 *   3. The bundle is slow or never lands. The class IS added, so the content
 *      is briefly hidden — then the failsafe below strips it again. That
 *      timer is the important half: without it, a chunk that 404s or a
 *      connection that stalls would leave the page blank indefinitely, which
 *      is precisely the failure the visibility work exists to remove.
 *
 * components/Reveal.jsx calls `window.__bnAnimReady()` from its first effect,
 * which cancels the failsafe: by then the observer is attached and the reveal
 * is going to happen properly. The 2500ms budget is generous for a working
 * bundle on a slow connection and short enough that a broken one is not a
 * visible outage.
 *
 * It has to be inline and synchronous in <head> — a <Script> component, even
 * with `strategy="beforeInteractive"`, is part of the bundle this is insuring
 * against. It is wrapped in try/catch so that nothing here can be the reason
 * a page fails to render.
 *
 * EDITING IT IS FINE; the hash is computed from this constant at build time
 * and follows automatically. Do not inline a copy anywhere else.
 */
const ANIM_GATE = `(function(){try{
var d=document.documentElement;
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
d.classList.add('js-anim');
var t=setTimeout(function(){d.classList.remove('js-anim');},2500);
window.__bnAnimReady=function(){if(t){clearTimeout(t);t=0;}};
}catch(e){}})();`;

module.exports = { ANIM_GATE };
