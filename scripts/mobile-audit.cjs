// Finds what actually breaks on a phone: horizontal overflow, and which element
// is causing it. Reporting "the page scrolls sideways" is useless without naming
// the offender.
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:5173';
const WIDTHS = [320, 390];
const ROUTES = ['/#/', '/#/s', '/#/p/bz-1001', '/#/cart', '/#/checkout', '/#/orders'];

(async () => {
  const browser = await chromium.launch();
  let problems = 0;

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const report = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const offenders = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.right > docW + 1 || r.left < -1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 60),
              right: Math.round(r.right),
              left: Math.round(r.left),
              w: Math.round(r.width),
            });
          }
        }
        // Report only the outermost offenders; children inherit the overflow.
        const trimmed = offenders.filter(
          (o, _, all) => !all.some((p) => p !== o && p.w >= o.w && p.right >= o.right && p.left <= o.left && p.tag !== o.tag)
        );
        // Tap targets that are too small to hit reliably.
        const small = [];
        for (const el of document.querySelectorAll('a,button,select,input')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.height < 32) small.push(`${el.tagName.toLowerCase()}:${(el.textContent || '').trim().slice(0, 18)}(${Math.round(r.height)}px)`);
        }
        return {
          docW,
          scrollW: document.documentElement.scrollWidth,
          offenders: trimmed.slice(0, 5),
          small: [...new Set(small)].slice(0, 6),
        };
      });

      const overflow = report.scrollW > report.docW + 1;
      if (overflow || report.small.length) problems++;
      console.log(
        `${String(width).padEnd(4)} ${route.padEnd(16)} scrollW=${report.scrollW} docW=${report.docW}` +
          (overflow ? '  <-- OVERFLOW' : '')
      );
      if (overflow && report.offenders.length) {
        for (const o of report.offenders) console.log(`        ${o.tag}.${o.cls} w=${o.w} left=${o.left} right=${o.right}`);
      }
      if (report.small.length) console.log(`        small tap targets: ${report.small.join(', ')}`);
    }
    await page.close();
  }

  await browser.close();
  console.log(problems ? `\n${problems} route/width combination(s) with issues` : '\nNo mobile issues found.');
})();
