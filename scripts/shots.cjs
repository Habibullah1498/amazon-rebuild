// Headless screenshots + console/error capture. Used to actually look at the UI
// rather than infer it from a passing build.
const { chromium } = require('playwright');
const path = require('path');

const OUT = process.argv[2] || '.shots';
const BASE = process.argv[3] || 'http://localhost:5173';

const ROUTES = [
  ['home', '/#/'],
  ['search', '/#/s'],
  ['product', '/#/p/bz-1001'],
  ['cart', '/#/cart'],
  ['checkout', '/#/checkout'],
];

(async () => {
  const browser = await chromium.launch();
  const problems = [];

  for (const [name, route] of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const logs = [];
    page.on('console', (m) => m.type() === 'error' && logs.push(m.text()));
    page.on('pageerror', (e) => logs.push(`PAGEERROR: ${e.message}`));

    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const h1 = document.querySelector('h1')?.textContent ?? null;
      // Is any Tailwind utility actually applying? Check a known utility element.
      const probe = document.querySelector('.surface');
      const probeBg = probe ? getComputedStyle(probe).backgroundColor : null;
      const flexed = document.querySelector('.flex');
      const flexDisplay = flexed ? getComputedStyle(flexed).display : null;
      return {
        rootChildren: root ? root.children.length : -1,
        rootTextLength: root ? root.innerText.trim().length : -1,
        bodyBg,
        h1,
        probeBg,
        flexDisplay,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      };
    });

    await page.screenshot({ path: path.join(OUT, `${name}-desktop.png`), fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const mobile = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    await page.screenshot({ path: path.join(OUT, `${name}-mobile.png`), fullPage: false });

    const overflowDesktop = info.scrollW > info.clientW + 1;
    const overflowMobile = mobile.scrollW > mobile.clientW + 1;

    console.log(
      `${name.padEnd(9)} children=${info.rootChildren} text=${info.rootTextLength} ` +
        `flex=${info.flexDisplay} surfaceBg=${info.probeBg} bodyBg=${info.bodyBg}` +
        `${overflowDesktop ? ' OVERFLOW-DESKTOP' : ''}${overflowMobile ? ` OVERFLOW-MOBILE(${mobile.scrollW}>${mobile.clientW})` : ''}`
    );
    if (info.h1) console.log(`          h1: ${info.h1.slice(0, 70)}`);
    if (logs.length) {
      console.log(`          errors: ${logs.slice(0, 3).join(' | ')}`);
      problems.push(`${name}: ${logs[0]}`);
    }
    if (info.flexDisplay !== 'flex') problems.push(`${name}: tailwind utilities not applying (.flex -> ${info.flexDisplay})`);
    if (info.rootTextLength < 50) problems.push(`${name}: root nearly empty`);

    await page.close();
  }

  await browser.close();
  console.log(problems.length ? `\nPROBLEMS:\n- ${problems.join('\n- ')}` : '\nNo problems detected.');
})();
