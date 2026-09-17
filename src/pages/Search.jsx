import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES, BRANDS, categoryLabel } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import { Stars } from '../components/Bits';

const SORTS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Customer rating' },
  { id: 'reviews', label: 'Most reviewed' },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const brand = params.get('brand') ?? '';
  const sort = params.get('sort') ?? 'relevance';
  const maxPrice = Number(params.get('max') ?? 0);
  const minRating = Number(params.get('rating') ?? 0);
  const fastOnly = params.get('fast') === '1';
  const inStock = params.get('stock') === '1';
  const dealsOnly = params.get('deals') === '1';

  // All filter state lives in the URL, so a filtered view is shareable and the
  // back button steps through refinements instead of leaving the results page.
  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (!value || value === '0') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: false });
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    setParams(next);
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (needle) {
        const haystack = `${p.title} ${p.brand} ${p.blurb} ${categoryLabel(p.category)}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (cat && p.category !== cat) return false;
      if (brand && p.brand !== brand) return false;
      if (maxPrice && p.price > maxPrice) return false;
      if (minRating && p.rating < minRating) return false;
      if (fastOnly && !p.fast) return false;
      if (inStock && p.stock === 0) return false;
      if (dealsOnly && !p.listPrice) return false;
      return true;
    });

    const by = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      reviews: (a, b) => b.reviews - a.reviews,
      // Relevance: in-stock first, then rating weighted by review volume.
      relevance: (a, b) =>
        (b.stock > 0) - (a.stock > 0) || b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10),
    };
    return [...list].sort(by[sort] ?? by.relevance);
  }, [q, cat, brand, sort, maxPrice, minRating, fastOnly, inStock, dealsOnly]);

  const activeCount = [cat, brand, maxPrice, minRating, fastOnly, inStock, dealsOnly].filter(Boolean).length;

  const filters = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--fg-strong)' }}>
          Category
        </h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setParam('cat', '')}
              className="hover:underline"
              style={{ color: !cat ? 'var(--color-teal-brand)' : 'var(--fg-muted)', fontWeight: !cat ? 600 : 400 }}
            >
              All categories
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParam('cat', c.id)}
                className="hover:underline"
                style={{ color: cat === c.id ? 'var(--color-teal-brand)' : 'var(--fg-muted)', fontWeight: cat === c.id ? 600 : 400 }}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--fg-strong)' }}>
          Brand
        </h3>
        <select
          value={brand}
          onChange={(e) => setParam('brand', e.target.value)}
          className="w-full rounded-lg border px-2 py-1.5 text-sm"
          style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
        >
          <option value="">Any brand</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--fg-strong)' }}>
          Max price: {maxPrice ? `$${maxPrice}` : 'any'}
        </h3>
        <input
          type="range"
          min="0"
          max="1500"
          step="25"
          value={maxPrice}
          onChange={(e) => setParam('max', e.target.value)}
          className="w-full"
          aria-label="Maximum price"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--fg-strong)' }}>
          Rating
        </h3>
        <ul className="space-y-1 text-sm">
          {[4.5, 4, 3].map((r) => (
            <li key={r}>
              <button
                onClick={() => setParam('rating', minRating === r ? '' : String(r))}
                className="flex items-center gap-2 hover:underline"
                style={{ color: minRating === r ? 'var(--color-teal-brand)' : 'var(--fg-muted)' }}
              >
                <Stars rating={r} /> <span>{r} & up</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 text-sm">
        {[
          ['fast', fastOnly, 'Fast delivery only'],
          ['stock', inStock, 'In stock only'],
          ['deals', dealsOnly, 'Discounted only'],
        ].map(([key, val, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2" style={{ color: 'var(--fg-body)' }}>
            <input type="checkbox" checked={val} onChange={(e) => setParam(key, e.target.checked ? '1' : '')} />
            {label}
          </label>
        ))}
      </div>

      {activeCount > 0 && (
        <button onClick={clearAll} className="text-sm font-medium hover:underline" style={{ color: 'var(--color-rose-sale)' }}>
          Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {q ? `Results for “${q}”` : cat ? categoryLabel(cat) : 'All products'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            {results.length} {results.length === 1 ? 'item' : 'items'}
            {activeCount > 0 && ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} applied`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="surface px-3 py-2 text-sm font-medium lg:hidden"
            style={{ color: 'var(--fg-body)' }}
          >
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--fg-muted)' }}>
            Sort
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-sm"
              style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">{filters}</aside>
        {panelOpen && <aside className="surface mb-4 w-full p-4 lg:hidden">{filters}</aside>}

        <div className="min-w-0 flex-1">
          {results.length === 0 ? (
            <div className="surface p-10 text-center">
              <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--fg-strong)' }}>
                Nothing matched that
              </h2>
              <p className="mb-4 text-sm" style={{ color: 'var(--fg-muted)' }}>
                Try removing a filter, or browse everything instead.
              </p>
              <Link to="/s" className="text-sm font-medium underline" style={{ color: 'var(--color-teal-brand)' }}>
                Clear search
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} layout="row" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
