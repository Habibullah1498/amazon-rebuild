import { Link } from 'react-router-dom';
import ProductArt from './ProductArt';
import { Stars, Price, Badge } from './Bits';

export default function ProductCard({ product, layout = 'grid' }) {
  const row = layout === 'row';
  return (
    <article
      className={`surface group flex overflow-hidden transition hover:shadow-md ${
        row ? 'flex-col gap-4 p-4 sm:flex-row' : 'flex-col'
      }`}
    >
      <Link
        to={`/p/${product.id}`}
        className={row ? 'shrink-0 self-center sm:self-start' : 'block p-4 pb-0'}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductArt
          art={product.art}
          tint={product.tint}
          className={row ? 'h-40 w-40' : 'h-44 w-full'}
        />
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${row ? '' : 'p-4'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {product.fast && <Badge tone="fast">Fast delivery</Badge>}
          {product.stock === 0 && <Badge tone="warn">Out of stock</Badge>}
          {product.listPrice && <Badge tone="warn">Deal</Badge>}
        </div>

        <h3 className={row ? 'text-lg font-medium' : 'text-sm font-medium'} style={{ color: 'var(--fg-strong)' }}>
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

        {row && (
          <p className="line-clamp-2 text-sm" style={{ color: 'var(--fg-muted)' }}>
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
