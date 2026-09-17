// Server-renders every route and asserts on the output. This is not a substitute
// for clicking through the app in a browser, but it catches the failures that
// would otherwise only show up there: import cycles, undefined components, props
// that throw, and routes that render empty.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../src/App';
import { StoreProvider } from '../src/store/StoreContext';
import { PRODUCTS } from '../src/data/catalog';

const routes = [
  ['/', 'home'],
  ['/s', 'all products'],
  ['/s?q=headphones', 'search query'],
  ['/s?cat=books&sort=price-asc', 'category + sort'],
  ['/s?q=zzzzznope', 'empty results'],
  ['/p/bz-1001', 'product detail'],
  ['/p/bz-4001', 'product with variants'],
  ['/p/bz-1008', 'out of stock product'],
  ['/p/does-not-exist', 'missing product'],
  ['/cart', 'empty cart'],
  ['/checkout', 'checkout with empty cart'],
  ['/orders', 'no orders'],
  ['/order/nope', 'missing order'],
  ['/totally/unknown', '404'],
];

let failures = 0;

for (const [route, label] of routes) {
  try {
    const html = renderToString(
      <StaticRouter location={route}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </StaticRouter>
    );
    if (html.length < 500) {
      console.log(`EMPTY  ${route.padEnd(32)} ${label} — only ${html.length} chars`);
      failures++;
    } else {
      console.log(`ok     ${route.padEnd(32)} ${label} (${html.length} chars)`);
    }
  } catch (err) {
    console.log(`FAIL   ${route.padEnd(32)} ${label} — ${err.message}`);
    failures++;
  }
}

// Every product page must render its own title, or the catalogue and the route
// have drifted apart.
let titleMisses = 0;
for (const p of PRODUCTS) {
  const html = renderToString(
    <StaticRouter location={`/p/${p.id}`}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </StaticRouter>
  );
  const needle = p.title.split(' ')[0];
  if (!html.includes(needle)) {
    console.log(`FAIL   /p/${p.id} does not render its title`);
    titleMisses++;
  }
}
console.log(`\n${PRODUCTS.length - titleMisses}/${PRODUCTS.length} product pages rendered their title`);

if (failures || titleMisses) {
  console.log(`\n${failures + titleMisses} problem(s)`);
  process.exit(1);
}
console.log('\nAll routes rendered.');
