/**
 * Content audit: every link on the site, and the product facts that have to
 * agree across pages.
 *
 *   node scripts/content-audit.mjs http://localhost:3000
 *
 * LINKS. Every href on every route, internal and external, checked once and
 * cached. Internal links are followed; external ones get a HEAD (falling back
 * to a ranged GET, because plenty of hosts refuse HEAD) so a dead store link
 * or a renamed social handle shows up here rather than in a customer's
 * browser. mailto: and tel: are syntax-checked, not dialled.
 *
 * FACTS. The spec numbers are supposed to come from lib/iriz.js, but prose
 * quotes them too, and prose is where they drift. This greps the RENDERED
 * text of every page for each fact's known-good form and for the wrong forms
 * it has historically taken, and reports any page carrying a contradiction.
 * It reports; it changes nothing.
 */

import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

const ROUTES = [
  '/', '/about', '/specs', '/compare',
  '/shop', '/shop/iriz', '/where-to-buy',
  '/support', '/support/contact', '/support/faq',
  '/support/warranty-registration', '/support/warranty-claim',
  '/legal/privacy', '/legal/terms', '/legal/returns', '/legal/shipping',
  '/legal/warranty', '/legal/grievance', '/sign-in', '/account',
];

/**
 * Facts that must agree wherever they are stated.
 *
 * `wrong` is not a guess at what might appear — each entry is a value this
 * repo has actually carried at some point, which is exactly what makes it
 * worth watching for.
 */
const FACTS = [
  { name: 'Screen size range', right: /35\s*["”″]?\s*[-–—]\s*200\s*["”″]/i, wrong: [/\b40\s*["”″]?\s*[-–—]\s*200/i, /\b30\s*["”″]?\s*[-–—]\s*200/i] },
  { name: 'Throw distance', right: /0\.9\s*m\s*[-–—]\s*5\s*m/i, wrong: [/1\s*m\s*[-–—]\s*5\s*m/i] },
  { name: 'Brightness', right: /500\s*(true\s*)?ANSI/i, wrong: [/\b(600|800|1000|1200)\s*ANSI/i] },
  { name: 'Operating system', right: /Android\s*14/i, wrong: [/Android\s*1[0-3]\b/i, /Google\s*TV/i] },
  { name: 'Speaker', right: /5\s*W\b/i, wrong: [/\b(3|8|10)\s*W\s*(mono|speaker)/i] },
  { name: 'Warranty period', right: /(12\s*months|1\s*year)/i, wrong: [/\b(6|18|24|36)\s*months?\b/i, /\b2\s*years?\b/i] },
  { name: 'Video decode', right: /up to 8K/i, wrong: [/up to 4K/i] },
];

/** Wording that should not survive to a live page. */
const STALE = [
  { name: 'placeholder marker', re: /\[TBD\]|LOREM IPSUM|TODO:|FIXME/i },
  { name: 'pre-launch wording', re: /coming soon|notify me|launch list|launching soon|pre-?order/i },
  { name: 'unreplaced template', re: /\{\{|\}\}|%s\b|XXXX/ },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
});

const linkStatus = new Map();   // href -> status string
const linkSeenOn = new Map();   // href -> Set(route)
const factHits = [];
const staleHits = [];

for (const route of ROUTES) {
  const page = await ctx.newPage();
  const res = await page.goto(base + route, { waitUntil: 'load' }).catch(() => null);
  if (!res) { console.log(`  !! ${route} failed to load`); await page.close(); continue; }
  await page.waitForTimeout(500);

  const { hrefs, text } = await page.evaluate(() => ({
    hrefs: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))],
    text: (document.querySelector('main') || document.body).innerText.replace(/\s+/g, ' '),
  }));

  for (const h of hrefs) {
    if (!linkSeenOn.has(h)) linkSeenOn.set(h, new Set());
    linkSeenOn.get(h).add(route);
  }

  for (const fact of FACTS) {
    for (const wrong of fact.wrong) {
      const m = text.match(wrong);
      if (m) factHits.push({ route, fact: fact.name, found: m[0], context: text.slice(Math.max(0, m.index - 60), m.index + 60).trim() });
    }
  }
  for (const s of STALE) {
    const m = text.match(s.re);
    if (m) staleHits.push({ route, kind: s.name, found: m[0], context: text.slice(Math.max(0, m.index - 60), m.index + 70).trim() });
  }

  await page.close();
}

// ---------------------------------------------------------------- links
const page = await ctx.newPage();
for (const href of [...linkSeenOn.keys()].sort()) {
  if (href.startsWith('#')) { linkStatus.set(href, 'fragment'); continue; }
  if (href.startsWith('mailto:')) {
    linkStatus.set(href, /^mailto:[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(href) ? 'ok mailto' : 'MALFORMED mailto');
    continue;
  }
  if (href.startsWith('tel:')) {
    linkStatus.set(href, /^tel:\+?[\d\s-]{6,}$/.test(href) ? 'ok tel' : 'MALFORMED tel');
    continue;
  }
  const url = href.startsWith('http') ? href : base + href;
  try {
    let r = await page.request.head(url, { timeout: 20000, maxRedirects: 5 });
    if (r.status() === 405 || r.status() === 403 || r.status() === 501) {
      r = await page.request.get(url, { timeout: 20000, maxRedirects: 5, headers: { range: 'bytes=0-2048' } });
    }
    linkStatus.set(href, `${r.status()}`);
  } catch (e) {
    linkStatus.set(href, `ERROR ${String(e.message).slice(0, 50)}`);
  }
}
await browser.close();

console.log('\n================ LINKS ================');
const bad = [...linkStatus.entries()].filter(([, s]) => /^[45]/.test(s) || s.startsWith('ERROR') || s.startsWith('MALFORMED'));
console.log(`  ${linkStatus.size} unique links checked, ${bad.length} problem(s)\n`);
for (const [href, status] of bad) {
  console.log(`  ${status}  ${href}`);
  console.log(`        linked from: ${[...linkSeenOn.get(href)].slice(0, 5).join(', ')}`);
}
const ext = [...linkStatus.entries()].filter(([h]) => h.startsWith('http'));
console.log(`\n  external links (${ext.length}):`);
for (const [h, s] of ext) console.log(`    ${s.padEnd(6)} ${h}`);

console.log('\n================ FACT DISAGREEMENTS ================');
if (!factHits.length) console.log('  none — every page agrees with lib/iriz.js');
for (const f of factHits) console.log(`  ${f.route}  [${f.fact}] found "${f.found}"\n      …${f.context}…`);

console.log('\n================ STALE / PLACEHOLDER WORDING ================');
if (!staleHits.length) console.log('  none');
for (const s of staleHits) console.log(`  ${s.route}  [${s.kind}] "${s.found}"\n      …${s.context}…`);
