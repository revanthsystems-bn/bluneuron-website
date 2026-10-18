import { readFile } from 'node:fs/promises';
const r = JSON.parse(await readFile(process.argv[2], 'utf8'));
const c = r.categories, a = r.audits;
console.log(`=== LIGHTHOUSE ${r.configSettings.formFactor.toUpperCase()} — ${r.finalDisplayedUrl} ===`);
for (const k of ['performance', 'accessibility', 'best-practices', 'seo']) if (c[k]) console.log('  ' + k.padEnd(16), Math.round(c[k].score * 100));
console.log('  --- vitals ---');
for (const k of ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'])
  if (a[k]) console.log('  ' + k.padEnd(28), a[k].displayValue);
const opps = Object.values(a).filter(x => x.details && x.details.overallSavingsMs > 80).sort((x, y) => y.details.overallSavingsMs - x.details.overallSavingsMs);
if (opps.length) { console.log('  --- opportunities ---'); opps.slice(0, 8).forEach(x => console.log('   ', String(Math.round(x.details.overallSavingsMs) + 'ms').padStart(7), x.title.slice(0, 62))); }
const a11yIds = new Set((c.accessibility?.auditRefs || []).map(x => x.id));
const fails = Object.values(a).filter(x => a11yIds.has(x.id) && x.score !== null && x.score < 1);
if (fails.length) { console.log('  --- failing a11y ---'); fails.forEach(x => console.log('    -', x.title.slice(0, 72))); }
const bpIds = new Set((c['best-practices']?.auditRefs || []).map(x => x.id));
const bpf = Object.values(a).filter(x => bpIds.has(x.id) && x.score !== null && x.score < 1);
if (bpf.length) { console.log('  --- failing best-practices ---'); bpf.forEach(x => console.log('    -', x.title.slice(0, 72))); }
