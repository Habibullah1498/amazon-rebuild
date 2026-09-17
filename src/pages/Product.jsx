import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { findProduct, PRODUCTS, categoryLabel } from '../data/catalog';
import { useStore, money } from '../store/StoreContext';
import ProductArt from '../components/ProductArt';
import ProductCard from '../components/ProductCard';
import { Stars, Price, Badge, Button, Stock } from '../components/Bits';

// Deterministic review distribution derived from the product's own rating, so the
// histogram always agrees with the headline number.
function distribution(rating, total) {
  const weights = [5, 4, 3, 2, 1].map((star) => Math.max(0.02, 1 - Math.abs(star - rating) / 2.2) ** 3);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w, i) => ({ star: 5 - i, count: Math.round((w / sum) * total) }));
}

const VOICES = [
  { name: 'D. Okafor', title: 'Does what it says', body: 'Three months in and no complaints. The build quality is the part that surprised me.' },
  { name: 'R. Lindqvist', title: 'Good, with one caveat', body: 'Happy overall. Took a week longer to arrive than the estimate suggested, which is why this is four stars and not five.' },
  { name: 'M. Haddad', title: 'Replaced something twice the price', body: 'I was sceptical at this price. It has outlasted the branded one it replaced.' },
];

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const product = findProduct(id);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(product?.variants?.options?.[2] ?? null);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          We couldn’t find that product
        </h1>
        <Link to="/s" className="underline">
          Browse everything
        </Link>
      </div>
    );
  }

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const dist = distribution(product.rating, product.reviews);
  const maxBar = Math.max(...dist.map((d) => d.count));
  const outOfStock = product.stock === 0;

  function addToCart() {
    dispatch({ type: 'add', id: product.id, variant, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  function buyNow() {
    dispatch({ type: 'add', id: product.id, variant, qty });
    navigate('/checkout');
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <nav className="mb-4 text-sm" style={{ color: 'var(--fg-muted)' }}>
        <Link to="/s" className="hover:underline">
          All
        </Link>
        {' / '}
        <Link to={`/s?cat=${product.category}`} className="hover:underline">
          {categoryLabel(product.category)}
        </Link>
        {' / '}
        <span style={{ color: 'var(--fg-body)' }}>{product.brand}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div className="surface flex items-center justify-center p-6">
          <ProductArt art={product.art} tint={product.tint} className="h-full max-h-[420px] w-full" alt={product.title} />
        </div>

        <div>
          <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {product.title}
          </h1>
          <Link to={`/s?brand=${encodeURIComponent(product.brand)}`} className="text-sm hover:underline" style={{ color: 'var(--color-teal-brand)' }}>
            More from {product.brand}
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--fg-muted)' }}>
            <Stars rating={product.rating} size={16} />
            <span style={{ color: 'var(--fg-body)' }}>{product.rating.toFixed(1)}</span>
            <a href="#reviews" className="hover:underline">
              {product.reviews.toLocaleString()} reviews
            </a>
          </div>

          <hr className="my-4" />

          <Price value={product.price} list={product.listPrice} size="lg" />
          {product.listPrice && (
            <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
              You save {money(product.listPrice - product.price)}. This compares against our own price last month,
              not a made-up RRP.
            </p>
          )}

          <p className="mt-4 leading-relaxed" style={{ color: 'var(--fg-body)' }}>
            {product.blurb}
          </p>

          <ul className="mt-4 space-y-1.5">
            {product.bullets.map((b) => (
              <li key={b} className="flex gap-2 text-sm" style={{ color: 'var(--fg-body)' }}>
                <span style={{ color: 'var(--color-teal-brand)' }}>✓</span>
                {b}
              </li>
            ))}
          </ul>

          <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>
            Specifications
          </h2>
          <dl className="surface divide-y overflow-hidden text-sm">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt style={{ color: 'var(--fg-muted)' }}>{k}</dt>
                <dd className="text-right font-medium" style={{ color: 'var(--fg-body)' }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="surface space-y-4 p-5">
            <Price value={product.price} list={product.listPrice} size="lg" />
            <Stock count={product.stock} days={product.deliveryDays} />

            {product.fast && <Badge tone="fast">Fast delivery available</Badge>}

            {product.variants && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium" style={{ color: 'var(--fg-body)' }}>
                  {product.variants.label}
                </span>
                <select
                  value={variant ?? ''}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
                >
                  {product.variants.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-1 block font-medium" style={{ color: 'var(--fg-body)' }}>
                Quantity
              </span>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                disabled={outOfStock}
                className="w-full rounded-lg border px-3 py-2"
                style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
              >
                {Array.from({ length: Math.min(10, Math.max(product.stock, 1)) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <Button onClick={addToCart} disabled={outOfStock} className="w-full">
              {added ? 'Added to cart ✓' : 'Add to cart'}
            </Button>
            <Button onClick={buyNow} disabled={outOfStock} variant="dark" className="w-full">
              Buy now
            </Button>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              Free returns for 30 days. Shipping and tax are included in the total you see at checkout —
              nothing is added at the last step.
            </p>
          </div>
        </aside>
      </div>

      <section id="reviews" className="mt-12">
        <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          What buyers said
        </h2>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="surface p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-3xl font-bold" style={{ color: 'var(--fg-strong)' }}>
                {product.rating.toFixed(1)}
              </span>
              <Stars rating={product.rating} size={18} />
            </div>
            <p className="mb-4 text-sm" style={{ color: 'var(--fg-muted)' }}>
              {product.reviews.toLocaleString()} verified purchases
            </p>
            {dist.map((d) => (
              <div key={d.star} className="mb-1.5 flex items-center gap-2 text-xs">
                <span className="w-8" style={{ color: 'var(--fg-muted)' }}>
                  {d.star} ★
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded" style={{ background: 'var(--bg-sunken)' }}>
                  <span
                    className="block h-full rounded"
                    style={{ width: `${(d.count / maxBar) * 100}%`, background: 'var(--color-amber-brand)' }}
                  />
                </span>
                <span className="w-12 text-right" style={{ color: 'var(--fg-muted)' }}>
                  {d.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {VOICES.map((v, i) => (
              <article key={v.name} className="surface p-5">
                <div className="mb-1 flex items-center gap-2">
                  <Stars rating={i === 1 ? 4 : 5} />
                  <h3 className="font-semibold" style={{ color: 'var(--fg-strong)' }}>
                    {v.title}
                  </h3>
                </div>
                <p className="mb-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
                  {v.name} · verified purchase
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-body)' }}>
                  {v.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            More in {categoryLabel(product.category)}
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
