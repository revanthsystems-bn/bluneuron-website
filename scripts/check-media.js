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

const missing = [...referenced.entries()].filter(
  ([asset]) => !fs.existsSync(path.join(PUBLIC_DIR, asset.replace(/^\//, '')))
);

if (missing.length === 0) {
  console.log(`check-media: ${referenced.size} asset paths referenced, all present in public/.`);
  process.exit(0);
}

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
process.exit(1);
