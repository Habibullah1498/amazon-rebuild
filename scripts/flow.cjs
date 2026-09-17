// Drives the buying loop the way a customer would: search, open a product, add to
// cart, check out, and confirm the order lands in history. Asserts on the money at
// every step, because a storefront that renders correctly and totals incorrectly is
// still broken.
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:5173';
const fails = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(label);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // --- search -------------------------------------------------------------
  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
  await page.fill('input[aria-label="Search products"]', 'dutch oven');
  await page.waitForTimeout(300);
  const suggestions = await page.locator('[role="option"]').count();
  check('instant search suggests', suggestions > 0, `${suggestions} suggestion(s)`);

  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const resultCount = await page.locator('article').count();
  check('search results render', resultCount > 0, `${resultCount} result(s)`);

  // --- product ------------------------------------------------------------
  await page.goto(`${BASE}/#/p/bz-2002`, { waitUntil: 'networkidle' });
  const title = await page.locator('h1').first().textContent();
  check('product page shows the right item', /Dutch Oven/i.test(title), title);

  await page.selectOption('select >> nth=0', '2'); // quantity
  await page.click('button:has-text("Add to cart")');
  await page.waitForTimeout(400);
  const badge = await page.locator('header span:has-text("2")').first().textContent().catch(() => null);
  check('cart badge updates', badge === '2', `badge=${badge}`);

  // --- cart ---------------------------------------------------------------
  await page.goto(`${BASE}/#/cart`, { waitUntil: 'networkidle' });
  const bodyText = await page.locator('body').innerText();
  // 2 x 129.00 = 258.00, free shipping over 60, tax 8.25% = 21.29, total 279.29
  check('cart subtotal correct', bodyText.includes('$258.00'), 'expected $258.00');
  check('shipping free over threshold', /Free/.test(bodyText));
  check('tax shown before checkout', bodyText.includes('$21.29'), 'expected $21.29');
  check('total correct', bodyText.includes('$279.29'), 'expected $279.29');

  // --- checkout -----------------------------------------------------------
  await page.click('a:has-text("Checkout")');
  await page.waitForTimeout(400);

  // Submitting empty must not place an order.
  await page.click('button:has-text("Place order")');
  await page.waitForTimeout(300);
  const stillCheckout = page.url().includes('/checkout');
  check('validation blocks an empty order', stillCheckout, page.url());
  const invalid = await page.locator('[aria-invalid="true"]').count();
  check('invalid fields are flagged', invalid > 0, `${invalid} field(s)`);

  await page.fill('input[autocomplete="name"]', 'Irteza Test');
  await page.fill('input[type="email"]', 'irteza@example.com');
  await page.fill('input[autocomplete="street-address"]', '14 Bridge Street');
  await page.fill('input[autocomplete="address-level2"]', 'Manchester');
  await page.fill('input[autocomplete="postal-code"]', 'M1 4AB');
  await page.fill('input[inputmode="numeric"]', '4242424242424242');

  await page.click('button:has-text("Place order")');
  await page.waitForTimeout(1600);
  const onConfirm = /#\/order\/BZ-/.test(page.url());
  check('order placed and routed to confirmation', onConfirm, page.url());

  const confirmText = await page.locator('body').innerText();
  check('confirmation shows total paid', confirmText.includes('$279.29'));
  check('confirmation shows delivery date', /Arriving/.test(confirmText));

  // --- order history + cart cleared ---------------------------------------
  await page.goto(`${BASE}/#/orders`, { waitUntil: 'networkidle' });
  const ordersText = await page.locator('body').innerText();
  check('order appears in history', /Dutch Oven/i.test(ordersText));
  check('history shows order total', ordersText.includes('$279.29'));

  await page.goto(`${BASE}/#/cart`, { waitUntil: 'networkidle' });
  const cartAfter = await page.locator('body').innerText();
  check('cart emptied after purchase', /cart is empty/i.test(cartAfter));

  // --- persistence --------------------------------------------------------
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(`${BASE}/#/orders`, { waitUntil: 'networkidle' });
  const afterReload = await page.locator('body').innerText();
  check('orders survive a reload', /Dutch Oven/i.test(afterReload));

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? `\n${fails.length} FAILING: ${fails.join(', ')}` : '\nBuying loop works end to end.');
  process.exit(fails.length ? 1 : 0);
})();
