/**
 * Renders anything in design-src/ to a PNG at 2x.
 *
 * This is the tool behind two different jobs, which is why it lives here and
 * not in scratchpad:
 *
 *   1. MOCKS — design-src/mocks/*.html, rendered for review only.
 *   2. REPLACEMENT PRODUCT IMAGES — design-src/images/*.html, rendered into
 *      public/media/ as real site assets. Those files are the EDITABLE SOURCE
 *      for images that would otherwise be un-editable baked artwork, which is
 *      the whole reason the folder exists. Change the HTML, re-run this, get
 *      a new PNG.
 *
 * Served over a local HTTP server rather than opened as file:// — a file://
 * page cannot load sibling assets reliably in Chromium, and the image sources
 * live up in public/.
 *
 * usage: node design-src/render.mjs <html-path> <out-path> [width] [height] [scale]
 *        height omitted  -> full page
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const [, , htmlPath, outPath, wRaw, hRaw, sRaw] = process.argv;
if (!htmlPath || !outPath) {
  console.error('usage: node design-src/render.mjs <html> <out.png> [w] [h] [scale]');
  process.exit(1);
}
const width = Number(wRaw || 1200);
const height = hRaw && hRaw !== 'full' ? Number(hRaw) : null;
const scale = Number(sRaw || 2);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: height || 1000 },
  deviceScaleFactor: scale,
});

const misses = [];
page.on('response', (r) => {
  if (r.status() >= 400) misses.push(`${r.status()} ${r.url().replace(base, '')}`);
});
page.on('pageerror', (e) => misses.push('JS ' + e.message.slice(0, 80)));

const url = base + '/' + path.relative(ROOT, path.resolve(htmlPath)).split(path.sep).join('/');
await page.goto(url, { waitUntil: 'networkidle' });
// Webfonts: networkidle can resolve before the face is applied.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
await page.screenshot({ path: outPath, fullPage: !height });

const box = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.body.scrollHeight }));
await browser.close();
server.close();

console.log(`${outPath}  css ${box.w}x${box.h} @${scale}x -> ${box.w * scale}x${box.h * scale}`);
if (misses.length) console.log('  PROBLEMS:\n   ' + [...new Set(misses)].join('\n   '));
