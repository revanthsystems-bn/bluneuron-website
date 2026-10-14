#!/usr/bin/env node
/**
 * SEO and placeholder validator — run against the BUILT site, not the source.
 *
 * WHY AGAINST A RUNNING SERVER. Every check below is about what a crawler
 * receives: the canonical in the <head>, the robots meta, whether a URL in
 * the sitemap actually resolves, whether "[TBD]" survived into an indexable
 * page. None of that is reliably answerable from the source — the draft
 * machinery in lib/routes.js computes it, Next merges metadata from layout
 * to page, and the homepage is server-rendered per request. So this boots
 * the production build and reads the HTML, which is the only artefact that
 * cannot lie about itself.
 *
 * WHY IT CRAWLS RATHER THAN READING A ROUTE LIST. A second list of routes
 * here would be a second thing to forget to update, which is exactly the
 * failure lib/routes.js exists to prevent — and a validator that checks a
 * stale list passes a site with a page it has never seen. Instead it walks
 * the site's own links from "/", which has the useful side effect of only
 * ever testing pages a visitor can actually reach, plus everything the
 * sitemap advertises. An orphan page in the sitemap is caught by the second
 * source; an unlinked page in neither is, correctly, not this script's
 * business.
 *
 * Usage:
 *   node scripts/validate-seo.js                 # builds nothing; starts `next start`
 *   BASE_URL=http://127.0.0.1:3000 node scripts/validate-seo.js   # use a running server
 *
 * Exits non-zero on the first category of real failure, after reporting all
 * of them — a validator that stops at the first problem turns one fix-and-
 * rerun cycle into five.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

/* ------------------------------------------------------------------ *
 * The expectations
 * ------------------------------------------------------------------ */

/**
 * Strings that must never reach a page a crawler is allowed to index.
 *
 * `[TBD]` is the placeholder marker from lib/site-config.js. It is allowed —
 * required, even — on a DRAFT page, which is why this check is conditional
 * on the page not sending `noindex`. The rest are the specific stand-ins
 * that have been in this project's source at some point and must not come
 * back: a documentation domain, a masked phone number, and the dummy Amazon
 * path from lib/commerce.js.
 */
const FORBIDDEN_WHEN_INDEXABLE = [
  { needle: '[TBD]', label: 'unfilled [TBD] placeholder' },
  { needle: 'example.com', label: 'example.com' },
  { needle: 'XXXXXXXXXX', label: 'masked phone number (XXXXXXXXXX)' },
  { needle: '+91-XXXX', label: 'masked phone number (+91-XXXX)' },
  { needle: 'dp/PLACEHOLDER', label: 'placeholder Amazon listing URL' },
  { needle: 'lorem ipsum', label: 'lorem ipsum' },
];

/** Forbidden on EVERY page, draft or not. A draft may be unfinished; it may not be wrong. */
const FORBIDDEN_ALWAYS = [
  { needle: 'example.com', label: 'example.com' },
  { needle: 'XXXXXXXXXX', label: 'masked phone number (XXXXXXXXXX)' },
  { needle: '+91-XXXX', label: 'masked phone number (+91-XXXX)' },
];

/* ------------------------------------------------------------------ *
 * Tiny HTML helpers. A parser would be a dependency; these are reading
 * four specific tags out of Next's own output, which is well-formed.
 * ------------------------------------------------------------------ */

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

function head(html) {
  const end = html.indexOf('</head>');
  return end === -1 ? html : html.slice(0, end);
}

function canonicalOf(html) {
  const tags = head(html).match(/<link[^>]*>/gi) || [];
  const tag = tags.find((t) => /rel="canonical"/i.test(t));
  return tag ? attr(tag, 'href') : null;
}

function metaContent(html, nameValue) {
  const tags = head(html).match(/<meta[^>]*>/gi) || [];
  const tag = tags.find((t) => new RegExp(`name="${nameValue}"`, 'i').test(t));
  return tag ? attr(tag, 'content') : null;
}

function titleOf(html) {
  const m = head(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function isNoindex(html) {
  const robots = metaContent(html, 'robots');
  return Boolean(robots && /noindex/i.test(robots));
}

/** Strip tags and JSON-LD so a needle in markup is not reported as body copy. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** Same-origin, hash- and query-stripped, trailing-slash-normalised path. */
function normalisePath(href, base) {
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.origin !== new URL(base).origin) return null;
  if (!/^https?:$/.test(url.protocol)) return null;
  let p = url.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function linksIn(html, base) {
  const out = new Set();
  for (const tag of html.match(/<a[^>]*>/gi) || []) {
    const href = attr(tag, 'href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }
    const p = normalisePath(href, base);
    // Skip file downloads: they are not pages and have no <head> to check.
    if (p && !/\.[a-z0-9]{2,5}$/i.test(p)) out.add(p);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The run
 * ------------------------------------------------------------------ */

/** SITE_URL, read from the one file that declares it. */
function siteUrl() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'site.js'), 'utf8');
  const m = src.match(/export const SITE_URL = '([^']+)'/);
  if (!m) throw new Error('Could not read SITE_URL from lib/site.js');
  return m[1];
}

/** Ask the OS for a port nothing is using, then release it for `next start`. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(String(port)));
    });
  });
}

async function waitForServer(base, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(base, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`Server did not start within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  const SITE_URL = siteUrl();
  const provided = process.env.BASE_URL;

  /**
   * A FREE port, found rather than assumed.
   *
   * This used to default to 3100. If anything was already listening there —
   * a `next start` left running from an earlier check, which is exactly what
   * happens during a screenshot session — `waitForServer` connected to THAT
   * server, the newly spawned one failed to bind, and the validator happily
   * reported a pass against a stale build. A validator that can silently
   * check the wrong thing is worse than no validator, so the port is bound
   * by the OS and handed over.
   */
  const port = process.env.PORT || (await freePort());
  const base = provided || `http://127.0.0.1:${port}`;

  let server = null;
  if (!provided) {
    // `node next/dist/bin/next`, not `npx next`. Spawning the `npx.cmd`
    // shim fails outright on Windows with EINVAL under Node's current
    // child_process rules (a .cmd needs a shell, and spawning through one
    // then leaks the real server process past server.kill()). Resolving the
    // bin and running it on this same interpreter avoids both.
    server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', port], {
      stdio: 'ignore',
      env: { ...process.env, PORT: port },
    });
    await waitForServer(base);
  }

  const errors = [];
  const warnings = [];
  const seen = new Map(); // path -> { status, html }
  const fail = (where, message) => errors.push(`${where}: ${message}`);

  async function load(p) {
    if (seen.has(p)) return seen.get(p);
    const res = await fetch(base + p, { redirect: 'manual' });
    const html = res.status === 200 ? await res.text() : '';
    const entry = { status: res.status, html };
    seen.set(p, entry);
    return entry;
  }

  /* --- 1. Crawl every linked page, breadth-first from the homepage. --- */
  const queue = ['/'];
  const crawled = new Set();
  while (queue.length) {
    const p = queue.shift();
    if (crawled.has(p)) continue;
    crawled.add(p);

    const { status, html } = await load(p);
    if (status !== 200) {
      fail(p, `linked page returned HTTP ${status}`);
      continue;
    }
    for (const next of linksIn(html, base)) {
      if (!crawled.has(next)) queue.push(next);
    }
  }

  /* --- 2. The sitemap: every URL in it must be real and indexable. --- */
  const sitemapRes = await fetch(`${base}/sitemap.xml`);
  if (!sitemapRes.ok) {
    fail('/sitemap.xml', `returned HTTP ${sitemapRes.status}`);
  }
  const sitemapXml = sitemapRes.ok ? await sitemapRes.text() : '';
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  if (sitemapRes.ok && sitemapUrls.length === 0) {
    fail('/sitemap.xml', 'contains no <loc> entries');
  }

  const sitemapPaths = new Set();
  for (const loc of sitemapUrls) {
    if (!loc.startsWith(SITE_URL)) {
      fail('/sitemap.xml', `entry is not on ${SITE_URL}: ${loc}`);
      continue;
    }
    const p = loc.slice(SITE_URL.length) || '/';
    sitemapPaths.add(p);
    const { status, html } = await load(p);
    if (status !== 200) {
      fail('/sitemap.xml', `lists ${p}, which returns HTTP ${status}`);
      continue;
    }
    if (isNoindex(html)) {
      fail('/sitemap.xml', `lists ${p}, which sends robots noindex — a contradiction`);
    }
  }

  /* --- 3. Per-page checks, over everything we loaded. --- */
  for (const [p, { status, html }] of [...seen].sort()) {
    if (status !== 200) continue;
    const text = visibleText(html);
    const indexable = !isNoindex(html);

    for (const { needle, label } of FORBIDDEN_ALWAYS) {
      if (text.toLowerCase().includes(needle.toLowerCase())) fail(p, `contains ${label}`);
    }
    if (indexable) {
      for (const { needle, label } of FORBIDDEN_WHEN_INDEXABLE) {
        if (text.toLowerCase().includes(needle.toLowerCase())) {
          fail(p, `is indexable and contains ${label}`);
        }
      }
      if (sitemapRes.ok && !sitemapPaths.has(p)) {
        warnings.push(`${p}: indexable and linked, but not listed in the sitemap`);
      }
    } else if (sitemapPaths.has(p)) {
      fail(p, 'sends noindex but is listed in the sitemap');
    }

    // Canonical: present, absolute, on SITE_URL, and naming THIS path.
    const canonical = canonicalOf(html);
    if (!canonical) {
      fail(p, 'has no canonical link');
    } else if (!canonical.startsWith(SITE_URL)) {
      fail(p, `canonical is not on ${SITE_URL}: ${canonical}`);
    } else {
      const canonicalPath = canonical.slice(SITE_URL.length) || '/';
      if (canonicalPath !== p) {
        fail(p, `canonical points at ${canonicalPath}`);
      }
    }

    const title = titleOf(html);
    if (!title) fail(p, 'has no <title>');
    else if (title.length > 70) warnings.push(`${p}: <title> is ${title.length} chars (>70)`);

    const description = metaContent(html, 'description');
    if (!description) fail(p, 'has no meta description');
    else if (description.length > 165) {
      warnings.push(`${p}: meta description is ${description.length} chars (>165)`);
    }
  }

  /* --- 4. robots.txt sanity. --- */
  const robotsRes = await fetch(`${base}/robots.txt`);
  if (!robotsRes.ok) {
    fail('/robots.txt', `returned HTTP ${robotsRes.status}`);
  } else {
    const robotsTxt = await robotsRes.text();
    if (!robotsTxt.includes(`${SITE_URL}/sitemap.xml`)) {
      fail('/robots.txt', 'does not point at the sitemap');
    }
    for (const line of robotsTxt.split('\n')) {
      const m = line.match(/^\s*Disallow:\s*(\S+)/i);
      if (!m) continue;
      const p = m[1];
      if (sitemapPaths.has(p)) fail('/robots.txt', `disallows ${p}, which is in the sitemap`);
    }
  }

  if (server) server.kill();

  /* --- Report. --- */
  const pages = [...seen].filter(([, v]) => v.status === 200).length;
  console.log(`\nSEO validator — ${pages} pages checked, ${sitemapPaths.size} in the sitemap\n`);

  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  ! ${w}`);
    console.log('');
  }

  if (errors.length) {
    console.log('Failures:');
    for (const e of errors) console.log(`  x ${e}`);
    console.log(`\n${errors.length} failure(s).\n`);
    process.exit(1);
  }

  console.log('All checks passed.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
