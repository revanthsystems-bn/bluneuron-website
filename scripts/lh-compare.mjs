/**
 * Lighthouse, two builds, interleaved.
 *
 *   node scripts/lh-compare.mjs <urlA> <urlB> [labelA] [labelB] [runs]
 *
 * WHY INTERLEAVED, AND WHY THE ORDER ALTERNATES.
 * ---------------------------------------------------------------------------
 * Lighthouse on this machine is noisy enough that two numbers taken minutes
 * apart cannot be compared: whatever else the laptop is doing moves LCP by
 * more than most real changes do. Running five of A and then five of B does
 * not fix that — it just moves the noise into the gap between the two
 * batches. So the runs alternate A, B, A, B, and the ORDER FLIPS on every
 * other pass (A,B then B,A), which cancels the systematic advantage the
 * second URL of a pair gets from a warm browser and a warm server.
 *
 * MEDIAN, not mean, for the same reason Lighthouse's own docs give: one
 * run that collided with a background task is an outlier, and a mean carries
 * it into the result where a median does not.
 *
 * Mobile is the default form factor and the default throttling, left alone
 * deliberately — it is the profile the hero was given a budget against.
 *
 * Local tooling, like scripts/shot.mjs and scripts/hero-shot.mjs. Nothing in
 * the app, the build or any host loads it.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [urlA, urlB, labelA = 'A', labelB = 'B', runsArg] = process.argv.slice(2);
if (!urlA || !urlB) {
  console.error('usage: node scripts/lh-compare.mjs <urlA> <urlB> [labelA] [labelB] [runs]');
  process.exit(2);
}
const RUNS = Number(runsArg || 5);
const work = mkdtempSync(join(tmpdir(), 'lh-'));

/** The three the hero was given a budget against, plus the overall score. */
const METRICS = [
  ['performance', 'Performance', (lhr) => Math.round(lhr.categories.performance.score * 100)],
  ['lcp', 'LCP', (lhr) => lhr.audits['largest-contentful-paint'].numericValue],
  ['cls', 'CLS', (lhr) => lhr.audits['cumulative-layout-shift'].numericValue],
  ['tbt', 'TBT', (lhr) => lhr.audits['total-blocking-time'].numericValue],
  ['fcp', 'FCP', (lhr) => lhr.audits['first-contentful-paint'].numericValue],
  ['si', 'Speed Index', (lhr) => lhr.audits['speed-index'].numericValue],
];

function run(url, tag, n) {
  const out = join(work, `${tag}-${n}.json`);
  const r = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'lighthouse', url,
      '--only-categories=performance',
      '--output=json',
      `--output-path=${out}`,
      // A fresh user-data-dir per run, so nothing carries between them.
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--quiet',
    ],
    { encoding: 'utf8', shell: process.platform === 'win32', timeout: 180000 },
  );
  if (r.status !== 0) {
    console.error(`  ${tag} run ${n} FAILED: ${(r.stderr || '').slice(-400)}`);
    return null;
  }
  const lhr = JSON.parse(readFileSync(out, 'utf8'));
  const row = {};
  for (const [key, , read] of METRICS) row[key] = read(lhr);
  console.error(
    `  ${tag.padEnd(12)} run ${n}: perf ${row.performance}  LCP ${Math.round(row.lcp)}ms`
    + `  CLS ${row.cls.toFixed(3)}  TBT ${Math.round(row.tbt)}ms  SI ${Math.round(row.si)}ms`,
  );
  return row;
}

const results = { [labelA]: [], [labelB]: [] };

for (let n = 1; n <= RUNS; n += 1) {
  // The flip. Odd passes run A first, even passes run B first.
  const order = n % 2 === 1
    ? [[urlA, labelA], [urlB, labelB]]
    : [[urlB, labelB], [urlA, labelA]];
  console.error(`\npass ${n}/${RUNS}  (${order.map((o) => o[1]).join(' then ')})`);
  for (const [url, label] of order) {
    const row = run(url, label, n);
    if (row) results[label].push(row);
  }
}

function median(values) {
  if (!values.length) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const fmt = {
  performance: (v) => String(Math.round(v)),
  lcp: (v) => `${Math.round(v)} ms`,
  cls: (v) => v.toFixed(3),
  tbt: (v) => `${Math.round(v)} ms`,
  fcp: (v) => `${Math.round(v)} ms`,
  si: (v) => `${Math.round(v)} ms`,
};
// Higher is better for the score; lower is better for every metric.
const higherIsBetter = new Set(['performance']);

const rows = [];
for (const [key, name] of METRICS) {
  const a = median(results[labelA].map((r) => r[key]));
  const b = median(results[labelB].map((r) => r[key]));
  const delta = a - b;
  const better = higherIsBetter.has(key) ? delta >= 0 : delta <= 0;
  const sign = delta > 0 ? '+' : '';
  const deltaText = key === 'cls'
    ? `${sign}${delta.toFixed(3)}`
    : `${sign}${Math.round(delta)}${key === 'performance' ? '' : ' ms'}`;
  rows.push([
    name,
    fmt[key](b),
    fmt[key](a),
    deltaText,
    better ? 'no worse' : 'WORSE',
  ]);
}

const head = ['Metric', `${labelB} (median)`, `${labelA} (median)`, 'Delta', ''];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (cells) => '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';

console.log(`\nLighthouse mobile — median of ${RUNS}, runs interleaved and order-flipped`);
console.log(`  ${labelA}: ${urlA}`);
console.log(`  ${labelB}: ${urlB}\n`);
console.log(line(head));
console.log('|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|');
for (const r of rows) console.log(line(r));
console.log(
  `\nruns completed: ${labelA} ${results[labelA].length}/${RUNS}`
  + `, ${labelB} ${results[labelB].length}/${RUNS}`,
);

rmSync(work, { recursive: true, force: true });
