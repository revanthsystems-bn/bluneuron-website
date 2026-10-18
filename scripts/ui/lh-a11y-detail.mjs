import { readFile } from 'node:fs/promises';
const r = JSON.parse(await readFile(process.argv[2], 'utf8'));
for (const id of ['aria-prohibited-attr', 'td-has-header', 'th-has-data-cells', 'table-fake-caption']) {
  const a = r.audits[id];
  if (!a || a.score === null || a.score === 1) continue;
  console.log(`\n### ${a.title}`);
  for (const item of a.details?.items || []) {
    console.log('  snippet:', (item.node?.snippet || '').slice(0, 200));
    console.log('  explain:', (item.node?.explanation || item.subItems?.items?.[0]?.relatedNode?.snippet || '').slice(0, 220));
  }
}
