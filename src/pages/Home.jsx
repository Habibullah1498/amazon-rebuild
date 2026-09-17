import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import ProductArt from '../components/ProductArt';
import { Button } from '../components/Bits';

function Rail({ title, subtitle, items, to }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {to && (
          <Link to={to} className="shrink-0 text-sm font-medium hover:underline" style={{ color: 'var(--color-teal-brand)' }}>
            See all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const deals = PRODUCTS.filter((p) => p.listPrice).slice(0, 4);
  const topRated = [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const fast = PRODUCTS.filter((p) => p.fast && p.stock > 0).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <section className="surface mb-10 overflow-hidden">
        <div className="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-teal-brand)' }}>
              No dark patterns
            </p>
            <h1 className="mb-3 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--fg-strong)' }}>
              The everything store, without the tricks
            </h1>
            <p className="mb-6 text-base leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              Shipping and tax are in the total from the first screen. No countdown timers, no invented
              scarcity, no pre-ticked upsells at checkout. Just the thing you came for.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button as="link" to="/s" variant="primary">
                Start browsing
              </Button>
              <Button as="link" to="/s?deals=1" variant="ghost">
                See genuine deals
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['headphones', 'kettle', 'book', 'shoe', 'camera', 'chair'].map((art, i) => (
              <ProductArt
                key={art}
                art={art}
                tint={['#2f6f8f', '#b07d4a', '#3f5f8a', '#c25a3f', '#4a5568', '#4a5a6b'][i]}
                className="h-full w-full"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          Shop by category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const sample = PRODUCTS.find((p) => p.category === c.id);
            return (
              <Link key={c.id} to={`/s?cat=${c.id}`} className="surface flex flex-col items-center gap-2 p-4 hover:shadow-md">
                <ProductArt art={sample?.art} tint={sample?.tint} className="h-16 w-16" />
                <span className="text-center text-sm font-medium" style={{ color: 'var(--fg-strong)' }}>
                  {c.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Rail title="Actual discounts" subtitle="Measured against the price we genuinely sold at last month" items={deals} to="/s?deals=1" />
      <Rail title="Highest rated" subtitle="Sorted by rating, not by who paid for placement" items={topRated} to="/s?sort=rating" />
      <Rail title="Arrives this week" items={fast} to="/s?fast=1" />
    </div>
  );
}
