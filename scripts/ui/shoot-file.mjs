import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1560, height: 920 }, deviceScaleFactor: 2 });
await p.goto(process.argv[2], { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.screenshot({ path: process.argv[3], fullPage: true });
await b.close(); console.log('ok');
