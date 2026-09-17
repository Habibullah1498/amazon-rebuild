# Bazaar

A storefront rebuilt in a day — the Amazon shopping loop, without the dark patterns.

Built as an 8x take-home. **Not affiliated with Amazon.** Every product, price, rating and
review in here is invented, and the name and branding are deliberately its own rather than a
copy of a real retailer's.

## Run it

```bash
npm install
npm run dev      # dev server
npm run smoke    # server-renders every route and checks it isn't blank
npm run build    # production build into dist/
```

## What it does

The loop that makes a store a store:

**Search → results → product → cart → checkout → order → order history.**

- **Search** with instant suggestions, keyboard navigation (`↑`/`↓`/`Enter`) and `/` to focus
  from anywhere on the site.
- **Filtering** by category, brand, price ceiling, rating, stock, delivery speed and genuine
  discounts, with five sort orders.
- **Product pages** with specification tables, a review histogram derived from the product's own
  rating, stock and delivery honesty, and variant selection where it applies.
- **Cart** with quantity, save-for-later, and a running total that already includes shipping and tax.
- **Checkout** with real validation, three delivery speeds, and no pre-ticked anything.
- **Orders** with a delivery progress indicator and one-tap reorder.

Cart, saved items, orders and theme all persist in `localStorage`, so a reload doesn't lose your
basket.

## What I deliberately left out

Real authentication, real payments, seller tooling, recommendation models, returns flows,
Prime-style subscriptions, and reviews you can write yourself. They're surface area. With one day,
the buying loop had to be complete and good rather than broad and thin.

## Where it differs from the original, on purpose

| Amazon | Bazaar |
|---|---|
| Shipping and tax appear at the final checkout step | Both are in the total from the cart onward |
| "Only 3 left!" urgency on almost everything | Stock counts shown only when genuinely low, no timers |
| Discounts measured against an inflated list price | Discounts measured against our own price last month, and said so |
| Checkout upsells arrive pre-ticked | No pre-ticked extras anywhere |
| Sponsored results interleaved with organic ones | Sort order is the sort order you picked |
| Multiple delivery dates scattered across the page | One delivery date per item, stated once |

## Technical notes

- **React + Vite**, no UI framework. ~72 KB gzipped for the whole app.
- **HashRouter**, because this deploys as static files to GitHub Pages where deep links would
  otherwise 404 without server rewrites.
- **Product imagery is drawn, not fetched.** 25 hand-written SVG illustrations, tinted per product.
  Stock photography for an invented catalogue means either broken hotlinks or photos that don't
  match the listing; vector art stays coherent, works offline and adds no network weight.
- **Filter state lives in the URL**, so a filtered view is shareable and the back button steps
  back through refinements instead of leaving the page.
- **Light and dark themes** driven entirely by CSS custom properties, so no component carries
  per-theme branches.
- Respects `prefers-reduced-motion`, ships a skip link, uses visible focus rings, and keeps a
  16px gutter down to 400px width.

## Honest limitations

- **I could not click through this in a browser.** The environment it was built in has no browser
  automation, so verification is the route-level smoke test (`npm run smoke`, which server-renders
  all 14 routes plus all 30 product pages) and a production build served over HTTP with assets
  confirmed resolving. Visual and interaction testing needs a human.
- The catalogue is a seeded file, not a database. There is no backend.
- Checkout takes no payment. The card field accepts any digits and nothing leaves the browser.

## Agent logs

Every prompt and final response from the session that built this is in [`.agent-logs/`](.agent-logs/),
captured automatically via Claude Code hooks. See [CAPTURE-TEST.md](CAPTURE-TEST.md) for how that
works and what broke on the way.
