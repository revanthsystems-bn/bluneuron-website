#!/usr/bin/env node
/**
 * Every `/media/…` and `/brand/…` path in the source must exist in public/.
 *
 * WHY THIS EXISTS. `next/image` pointed at a missing local file is NOT a
 * build error. It compiles, deploys, and 404s at request time — so the
 * failure shows up as a hole in a live page, seen by a visitor, with nothing
 * in any log to say why. This repository had eleven such paths sitting in
 * lib/iriz.js at once. None of them happened to be rendered, which is luck
 * rather than design: every one was a single `<Image src={…}>` away from
 * being visible, and two of the arrays holding them were being brought back
 * into use.
 *
 * So the invariant is enforced rather than remembered: a path that cannot be
 * served does not get to sit in the source waiting for someone to render it.
 *
 * It is intentionally dumb — a regex for quoted absolute asset paths, then
 * `existsSync`. It cannot follow a path built at runtime
 * (`/media/${slug}.png`), and that is the known limit: build the path from a
 * constant in MEDIA and this will see it.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['lib', 'components', 'app'];
const PUBLIC_DIR = path.join(ROOT, 'public');

/** Quoted paths that look like a public asset: '/media/…' or '/brand/…'. */
const ASSET_RE = /['"`](\/(?:media|brand)\/[^'"`\s]+)['"`]/g;

function sourceFiles(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(rel, out);
    } else if (/\.(jsx?|mjs|css)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

const referenced = new Map(); // asset path -> [source files]

for (const file of SOURCE_DIRS.flatMap((d) => sourceFiles(d))) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const match of text.matchAll(ASSET_RE)) {
    const asset = match[1];
    if (!referenced.has(asset)) referenced.set(asset, []);
    if (!referenced.get(asset).includes(file)) referenced.get(asset).push(file);
  }
}

/*
 * SECOND CHECK: public/ HYGIENE.
 *
 * The check above answers "is every referenced path present?". It cannot
 * answer the opposite question — "is every file present one we meant to
 * ship?" — and that is the one that actually bit us.
 *
 * .gitignore is NOT sufficient protection here. OpenNext copies the whole of
 * public/ into .open-next/assets/ at build time and wrangler uploads it; git
 * is never consulted. An UNTRACKED file sitting in public/ is therefore
 * still a deployed, publicly fetchable file. So these rules are enforced at
 * check time, where they can actually stop a release.
 *
 *   1. SAVED-PAGE DUMPS. A Flipkart listing was saved into
 *      public/media/iriz/ as `iriz_photo.html` + `iriz_photo_files/` — 6 MB
 *      of third-party JavaScript, vendor SVGs and COMPETITOR product
 *      photography, served from our own origin at /media/iriz/iriz_photo.html.
 *      Nothing referenced it, which is precisely why it survived review: the
 *      check above only validates paths that ARE referenced.
 *
 *   2. SPACES AND BRACKETS IN FILENAMES. `Projector Shot (1).png` survives a
 *      local build and then fails in ways that are hard to attribute: the URL
 *      needs percent-encoding that hand-written `src` strings and CSS `url()`
 *      rarely carry, `(` and `)` are sub-delims in a URL path, and a name
 *      that round-trips through a shell script word-splits. Web-safe names
 *      are enforced rather than remembered.
 */
const HYGIENE_SKIP = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
const BAD_NAME_RE = /[\s()[\]{}'"#?%&,;:!*|<>^`~$@=+]/;
const hygiene = [];

function scanPublic(dir = '') {
  const abs = path.join(PUBLIC_DIR, dir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (HYGIENE_SKIP.has(entry.name)) continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;

    if (BAD_NAME_RE.test(entry.name)) {
      hygiene.push([rel, 'space or URL-unsafe character in the name — rename it kebab-case']);
    }

    if (entry.isDirectory()) {
      if (/_files$/.test(entry.name)) {
        // One finding is enough; do not walk thousands of scraped assets.
        hygiene.push([`${rel}/`, 'a "save page as" asset folder — must not ship; move it to _archive/']);
        continue;
      }
      scanPublic(rel);
    } else if (rel.startsWith('media/') && /\.html?$/i.test(entry.name)) {
      hygiene.push([rel, 'an HTML page under public/media — public/ holds media, not saved pages; move it to _archive/']);
    }
  }
}
scanPublic();

const missing = [...referenced.entries()].filter(
  ([asset]) => !fs.existsSync(path.join(PUBLIC_DIR, asset.replace(/^\//, '')))
);

if (missing.length === 0 && hygiene.length === 0) {
  console.log(`check-media: ${referenced.size} asset paths referenced, all present in public/.`);
  console.log('check-media: public/ hygiene clean — no unsafe filenames, no saved pages.');
  process.exit(0);
}

if (hygiene.length > 0) {
  console.error('\ncheck-media: files in public/ that must not ship as they are\n');
  for (const [file, why] of hygiene.sort()) {
    console.error(`  public/${file}`);
    console.error(`      ${why}`);
  }
  console.error(
    `\n${hygiene.length} problem file(s) in public/. NOTE: .gitignore does not`
      + '\nprotect you here — OpenNext copies all of public/ into the uploaded'
      + '\nassets regardless of what git tracks, so an untracked file in public/'
      + '\nis still live on the edge.\n'
  );
}

if (missing.length > 0) {
  console.error('\ncheck-media: referenced assets that do NOT exist in public/\n');
  for (const [asset, files] of missing.sort()) {
    console.error(`  ${asset}`);
    for (const file of files) console.error(`      referenced by ${file}`);
  }
  console.error(
    `\n${missing.length} missing asset(s). Either add the file to public/, point the`
      + '\nreference at an existing asset, or remove the reference. A next/image src'
      + '\nthat does not resolve is a 404 at request time, not a build error.\n'
  );
}

process.exit(1);
