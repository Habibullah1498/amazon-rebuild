// Renders every product photo next to its title in one grid and screenshots it.
// A resolved URL is not proof the picture shows the right thing — this is how the
// mismatches get spotted, by looking at them.
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const catalog = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'data', 'catalog.js'), 'utf8');
  const imagesSrc = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'data', 'images.js'), 'utf8');

  const ids = [...catalog.matchAll(/id:\s*'(bz-\d+)'[\s\S]{0,120}?title:\s*'([^']+)'/g)].map((m) => ({
    id: m[1],
    title: m[2],
  }));
  const photoIds = JSON.parse(imagesSrc.match(/PHOTO_IDS = (\{[\s\S]*?\});/)[1]);

  const cells = ids
    .map(({ id, title }) => {
      const pid = photoIds[id];
      const url = pid
        ? `https://images.unsplash.com/${pid}?auto=format&fit=crop&crop=entropy&w=300&h=300&q=72&fm=webp`
        : '';
      return `<figure>
        ${url ? `<img src="${url}" loading="eager">` : '<div class="missing">NO PHOTO</div>'}
        <figcaption><b>${id}</b><br>${title}</figcaption>
      </figure>`;
    })
    .join('');

  const html = `<!doctype html><meta charset="utf-8"><style>
    body{font:12px system-ui;background:#fff;margin:0;padding:12px}
    .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
    figure{margin:0}
    img,.missing{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#eee;display:block}
    .missing{display:flex;align-items:center;justify-content:center;color:#b00;font-weight:700}
    figcaption{font-size:10px;line-height:1.25;margin-top:4px;color:#222}
  </style><div class="grid">${cells}</div>`;

  const out = path.join(__dirname, '..', '.shots', 'sheet.html');
  require('fs').writeFileSync(out, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  const failed = [];
  page.on('response', (r) => {
    if (r.url().includes('images.unsplash.com') && !r.ok()) failed.push(`${r.status()} ${r.url().slice(0, 80)}`);
  });
  await page.goto(pathToFileURL(out).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(__dirname, '..', '.shots', 'contact-sheet.png'), fullPage: true });
  await browser.close();

  console.log(`products: ${ids.length}, photos mapped: ${Object.keys(photoIds).length}`);
  console.log(failed.length ? `FAILED REQUESTS:\n${failed.join('\n')}` : 'all image requests returned 200');
})();
