'use client';

import { useEffect, useRef } from 'react';

/**
 * Fades + slides content into view once it enters the viewport.
 * Wrap section headings, cards, or grids to give the whole site a
 * consistent premium scroll-in feel.
 *
 * ---------------------------------------------------------------------------
 * THE SERVER HTML IS VISIBLE. THAT IS THE WHOLE POINT OF THIS FILE.
 * ---------------------------------------------------------------------------
 * This used to be a framer-motion element with `initial={{ opacity: 0, y }}`,
 * which React serialises into the server-rendered markup as
 * `style="opacity:0;transform:translateY(28px)"`. Correct in a browser that
 * runs the bundle; a blank page in one that does not. The ways that happens
 * are not exotic — the in-app browsers that open a QR scan from WhatsApp,
 * Instagram or Google Lens, an older iOS Safari, a data saver, a flaky 4G
 * connection that drops a chunk. The customer standing over a new carton saw
 * an empty screen.
 *
 * So the hidden state is no longer rendered by React at all. It lives in ONE
 * css rule, `html.js-anim [data-reveal]` (app/globals.css), and the `js-anim`
 * class is added by the inline boot script in app/layout.jsx — which means it
 * is present only when:
 *
 *   - script execution works at all, and
 *   - the visitor has not asked for reduced motion, and
 *   - the page bundle arrived before the boot script's failsafe timer gave up
 *     and stripped the class again.
 *
 * Fail any of those and the content is simply there, in its normal
 * un-transformed state, at first paint. There is no inline opacity and no
 * inline transform in the server HTML. `node scripts/assert-visible-html.mjs
 * <base-url>` asserts exactly that against a running server or the live site;
 * run it if you touch this file.
 *
 * The reveal itself is an IntersectionObserver plus a `data-reveal-in`
 * attribute, so framer-motion is no longer loaded for this (it is still used
 * for the cart drawer, the popup and the sticky bar, which only ever render
 * after mount and so cannot ship a hidden server state).
 *
 * The prop surface is unchanged, deliberately: every existing caller keeps
 * working untouched. `amount` is still accepted and is now deliberately
 * ignored — see the note on the observer options below.
 */
export default function Reveal({
  children,
  className = '',
  style,
  delay = 0,
  y = 28,
  scale,
  once = true,
  // Accepted so no caller needs editing, and deliberately NOT honoured.
  // eslint-disable-next-line no-unused-vars
  amount,
  as: Tag = 'div',
  // Anything else (event handlers, aria-*, id) passes straight through to the
  // element, so callers don't need an extra wrapper div just to attach a
  // listener to the thing that animates.
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Tell the boot script its failsafe is not needed: the bundle is running,
    // so the hidden state will be lifted by the observer below rather than by
    // the timer. Harmless to call once per Reveal on the page.
    if (typeof window.__bnAnimReady === 'function') window.__bnAnimReady();

    // No `js-anim` means nothing is hidden — reduced motion, or the failsafe
    // already fired. Either way there is nothing to reveal, and attaching an
    // observer would only add work.
    if (!document.documentElement.classList.contains('js-anim')) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-reveal-in', '');
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal-in', '');
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.removeAttribute('data-reveal-in');
          }
        });
      },
      // `threshold: 0` and no rootMargin, which is framer-motion's
      // `amount: 'some'`: reveal as soon as ANY part of the box is in view.
      //
      // NEVER a fraction. A block taller than the viewport can never satisfy
      // `threshold: 0.5`, so on a 640px-tall phone the tall boards on /specs
      // and the long legal prose would scroll past and stay invisible for
      // the whole visit. That is the second half of the bug this file fixes,
      // and it is why the `amount` prop above is swallowed instead of being
      // passed through: several callers asked for 0.2-0.5.
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  // Custom properties only — the values the css rule interpolates. None of
  // these hides anything on their own: with no `js-anim` on <html> the rule
  // that reads them never matches, so they are inert declarations sitting on
  // a fully visible element.
  const vars = { '--reveal-y': `${y}px` };
  if (delay) vars['--reveal-delay'] = `${delay}s`;
  if (scale !== undefined) vars['--reveal-scale'] = scale;

  return (
    <Tag ref={ref} className={className} style={{ ...style, ...vars }} data-reveal="" {...rest}>
      {children}
    </Tag>
  );
}
