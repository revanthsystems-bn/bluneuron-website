/**
 * Loads every route with JAVASCRIPT DISABLED and asserts that a reader can
 * see all of it, then writes a full-page screenshot of each.
 *
 *   node scripts/assert-visible-nojs.mjs http://localhost:3000 screenshots/nojs
 *
 * This is the companion to scripts/assert-visible-html.mjs. That one greps
 * the markup for the inline styles that caused the bug; this one renders the
 * markup and measures what is actually on screen, which also catches a
 * stylesheet that hides content by class or by selector rather than inline.
 *
 * `javaScriptEnabled: false` is a stand-in for a real and ordinary set of
 * visitors, not a synthetic edge case: the in-app browsers that WhatsApp,
 * Instagram and Google Lens open a scanned QR code in, an older iOS Safari,
 * a data saver, and any connection that drops a chunk. The warranty pages
 * are reached by scanning the carton, so that is most of their traffic.
 *
 * Needs `playwright`, which is a devDependency — see the dependencies note in
 * CLAUDE.md. Nothing in the build or the runtime imports this file.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const outDir = process.argv[3] || 'screenshots/nojs';

const ROUTES = [
  ['/', 'home'],
  // See the note on the same entry in scripts/assert-visible-html.mjs.
  ['/club', 'club'],
  ['/support', 'support'],
  ['/support/warranty-registration', 'warranty-registration'],
  ['/support/warranty-claim', 'warranty-claim'],
  ['/legal/warranty', 'legal-warranty'],
  ['/legal/privacy', 'legal-privacy'],
  ['/legal/terms', 'legal-terms'],
  ['/legal/returns', 'legal-returns'],
  ['/legal/shipping', 'legal-shipping'],
  ['/about', 'about'],
  ['/specs', 'specs'],
  ['/compare', 'compare'],
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
// 375x640 is the small end of the phones this actually happens on — a 2019
// iPhone SE in an in-app browser whose chrome eats the rest of the screen.
// Short viewports are half the bug: a viewport fraction in a reveal's
// threshold is unsatisfiable for a block taller than 640px.
const ctx = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 375, height: 640 },
  deviceScaleFactor: 2,
});

let failures = 0;

for (const [route, name] of ROUTES) {
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: 'load' });

  // Let any CSS entrance animation finish before measuring.
  //
  // A css keyframe is NOT the bug this file hunts: it needs no bundle, it
  // starts at first paint, and the stylesheet that defines the from-state
  // defines the to-state in the same rule, so the two cannot be separated
  // the way markup and a bundle can. pages-polish uses one (`.rise-in`) for
  // exactly that reason, on the above-the-fold blocks. Measuring the instant
  // `load` fires catches those mid-fade and reports a false `opacity=0`.
  //
  // Waited from the DRIVER side, not with a promise inside the page. With
  // `javaScriptEnabled: false` the page's task queue does not run, so a
  // page-side `setTimeout` never fires and an `animation.finished` promise
  // never settles — an in-page wait hangs forever rather than timing out.
  // 900ms clears the longest entrance on any branch (`.rise-in`, 0.7s, plus
  // its largest stagger).
  await page.waitForTimeout(900);

  const report = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { error: 'no <main> element' };

    const hidden = [];
    let checked = 0;

    for (const el of main.querySelectorAll('h1,h2,h3,p,li,label,input,select,textarea,button,a,table,svg')) {
      // Out of scope, legitimately: decorative art, screen-reader-only text,
      // the honeypot fields in the forms, and the responsive variants of the
      // breakpoint-swapped subtitles.
      if (el.closest('[aria-hidden="true"]') || el.classList.contains('sr-only')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none') continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      checked += 1;
      if (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden') {
        hidden.push(`<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 48)}"> opacity=${cs.opacity}`);
      }
    }

    const heading = document.querySelector('main h1, main h2');
    const fields = [...document.querySelectorAll('main input:not([type=hidden]), main select, main textarea')]
      // The honeypots are supposed to be invisible; they are the one place on
      // the site where opacity-0 is the correct answer.
      .filter((f) => !String(f.className).includes('opacity-0'));

    // Three outcomes per field, and the middle one is the point of the split:
    //
    //   visible      laid out and readable. What we want.
    //   notLaidOut   an ancestor is display:none, so the field is not in the
    //                layout at all. On /support/warranty-registration that is
    //                the mobile stepper: below `md` the form shows one of two
    //                <fieldset>s and the other is `hidden md:block`. Not a
    //                rendering bug and nothing this change introduced — but
    //                with scripts off nothing can advance the step either, so
    //                it is counted and printed rather than ignored.
    //   invisible    laid out, and still unreadable — opacity or visibility.
    //                That is the bug this file exists to catch, and the only
    //                outcome that fails.
    const notLaidOut = [];
    const invisible = [];
    for (const f of fields) {
      const cs = getComputedStyle(f);
      if (cs.display === 'none' || (f.offsetParent === null && cs.position !== 'fixed')) {
        notLaidOut.push(f.name || f.id || f.tagName.toLowerCase());
      } else if (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden') {
        invisible.push(f.name || f.id || f.tagName.toLowerCase());
      }
    }

    return {
      jsAnim: document.documentElement.classList.contains('js-anim'),
      reveals: document.querySelectorAll('[data-reveal]').length,
      checked,
      hidden,
      headingOpacity: heading ? getComputedStyle(heading).opacity : null,
      fieldCount: fields.length,
      visibleFieldCount: fields.length - notLaidOut.length - invisible.length,
      notLaidOut,
      invisible,
      textLength: main.innerText.replace(/\s+/g, ' ').trim().length,
      scrollHeight: document.documentElement.scrollHeight,
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  await page.screenshot({ path: `${outDir}/${name}-375x640-nojs.png`, fullPage: true });
  await page.close();

  const bad = [];
  if (report.error) bad.push(report.error);
  // The gate class must NEVER arrive without script execution. If it does,
  // something is adding it from markup and the whole safety net is gone.
  if (report.jsAnim) bad.push('html.js-anim is present with JS disabled');
  if (report.hidden?.length) bad.push(`${report.hidden.length} invisible: ${report.hidden.slice(0, 3).join(' | ')}`);
  if (report.headingOpacity !== null && parseFloat(report.headingOpacity) < 0.99) {
    bad.push(`first heading at opacity ${report.headingOpacity}`);
  }
  if (report.textLength < 400) bad.push(`only ${report.textLength} characters of readable text`);
  if (report.invisible?.length) {
    bad.push(`${report.invisible.length} of ${report.fieldCount} form fields invisible: ${report.invisible.join(', ')}`);
  }
  if (report.hScroll > 1) bad.push(`${report.hScroll}px of horizontal scroll`);

  if (bad.length) {
    failures += 1;
    console.log(`FAIL  ${route}`);
    bad.forEach((b) => console.log(`        ${b}`));
  } else {
    console.log(
      `ok    ${route.padEnd(32)} ${String(report.checked).padStart(4)} elements · `
      + `${String(report.textLength).padStart(5)} chars · `
      + `${report.visibleFieldCount}/${report.fieldCount} fields · `
      + `${report.reveals} [data-reveal] · ${report.scrollHeight}px tall`
      + (report.notLaidOut?.length ? `
        note: ${report.notLaidOut.length} field(s) not in the layout below md (the mobile stepper's other step)` : ''),
    );
  }
}

await browser.close();
console.log(
  failures
    ? `\n${failures} of ${ROUTES.length} routes are not fully visible with JS disabled.`
    : `\nAll ${ROUTES.length} routes fully visible with JS disabled. Screenshots in ${outDir}/`,
);
process.exit(failures ? 1 : 0);
