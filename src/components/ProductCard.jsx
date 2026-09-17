import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { Stars, Price, Badge } from './Bits';

export default function ProductCard({ product, layout = 'grid' }) {
  const row = layout === 'row';
  return (
    <article
      className={`surface group flex overflow-hidden transition hover:shadow-md ${
        row ? 'flex-row gap-3 p-3 sm:gap-4 sm:p-4' : 'flex-col'
      }`}
    >
      <Link
        to={`/p/${product.id}`}
        className={row ? 'shrink-0 self-start' : 'block p-4 pb-0'}
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* Row cards stay horizontal on phones. Stacking them put a 160px image
            above the text and cost ~800px per result — roughly one product per
            screen, which makes a results list unusable. */}
        <ProductImage
          id={product.id}
          alt={product.title}
          className={row ? 'w-24 sm:w-40' : 'w-full'}
          sizes={row ? '(max-width: 640px) 96px, 160px' : '(max-width: 640px) 45vw, 300px'}
        />
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2 ${row ? '' : 'p-4'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {product.fast && <Badge tone="fast">Fast delivery</Badge>}
          {product.stock === 0 && <Badge tone="warn">Out of stock</Badge>}
          {product.listPrice && <Badge tone="warn">Deal</Badge>}
        </div>

        <h3
          className={row ? 'text-sm font-medium sm:text-lg' : 'text-sm font-medium'}
          style={{ color: 'var(--fg-strong)' }}
        >
          <Link to={`/p/${product.id}`} className="hover:underline">
            {product.title}
          </Link>
        </h3>

        <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
          {product.brand}
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
          <Stars rating={product.rating} />
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviews.toLocaleString()})</span>
        </div>

        {/* The blurb is the first thing to go when space is tight. */}
        {row && (
          <p className="hidden line-clamp-2 text-sm sm:block" style={{ color: 'var(--fg-muted)' }}>
            {product.blurb}
          </p>
        )}

        <Price value={product.price} list={product.listPrice} />

        <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
          {product.stock === 0 ? 'Restocking soon' : `Arrives in ${product.deliveryDays} days`}
        </div>
      </div>
    </article>
  );
}
