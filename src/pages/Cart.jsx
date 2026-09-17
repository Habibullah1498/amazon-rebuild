import { Link } from 'react-router-dom';
import { useStore, money } from '../store/StoreContext';
import ProductImage from '../components/ProductImage';
import { Button, Stars } from '../components/Bits';

export function Summary({ subtotal, shipping, tax, total, itemCount, children }) {
  return (
    <div className="surface p-5">
      <h2 className="mb-3 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
        Order summary
      </h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt style={{ color: 'var(--fg-muted)' }}>
            Items ({itemCount})
          </dt>
          <dd style={{ color: 'var(--fg-body)' }}>{money(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt style={{ color: 'var(--fg-muted)' }}>Shipping</dt>
          <dd style={{ color: shipping === 0 ? 'var(--color-teal-brand)' : 'var(--fg-body)' }}>
            {shipping === 0 ? 'Free' : money(shipping)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt style={{ color: 'var(--fg-muted)' }}>Estimated tax</dt>
          <dd style={{ color: 'var(--fg-body)' }}>{money(tax)}</dd>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between text-base font-bold">
          <dt style={{ color: 'var(--fg-strong)' }}>Total</dt>
          <dd style={{ color: 'var(--fg-strong)' }}>{money(total)}</dd>
        </div>
      </dl>
      {subtotal > 0 && subtotal < 60 && (
        <p className="mt-3 text-xs" style={{ color: 'var(--fg-muted)' }}>
          Spend {money(60 - subtotal)} more for free shipping — or don’t, the {money(shipping)} is already in the
          total above.
        </p>
      )}
      {children}
    </div>
  );
}

export default function Cart() {
  const { lines, savedLines, subtotal, shipping, tax, total, itemCount, dispatch } = useStore();

  if (lines.length === 0 && savedLines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          Your cart is empty
        </h1>
        <p className="mb-6" style={{ color: 'var(--fg-muted)' }}>
          Nothing in here yet.
        </p>
        <Button as="link" to="/s">
          Start browsing
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
        Your cart
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {lines.map((line) => (
            <article key={`${line.id}-${line.variant}`} className="surface flex flex-col gap-4 p-4 sm:flex-row">
              <Link to={`/p/${line.id}`} className="shrink-0 self-center">
                <ProductImage id={line.id} alt={line.product.title} className="h-28 w-28" sizes="112px" />
              </Link>

              <div className="min-w-0 flex-1">
                <h2 className="font-medium" style={{ color: 'var(--fg-strong)' }}>
                  <Link to={`/p/${line.id}`} className="hover:underline">
                    {line.product.title}
                  </Link>
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
                  <Stars rating={line.product.rating} />
                  <span>{line.product.brand}</span>
                </div>
                {line.variant && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
                    {line.product.variants?.label}: {line.variant}
                  </p>
                )}
                <p className="mt-1 text-sm" style={{ color: 'var(--color-teal-brand)' }}>
                  Arrives in {line.product.deliveryDays} days
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <span style={{ color: 'var(--fg-muted)' }}>Qty</span>
                    <select
                      value={line.qty}
                      onChange={(e) => dispatch({ type: 'setQty', index: line.index, qty: Number(e.target.value) })}
                      className="rounded-lg border px-2 py-1"
                      style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={() => dispatch({ type: 'remove', index: line.index })}
                    className="hover:underline"
                    style={{ color: 'var(--color-rose-sale)' }}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'saveForLater', index: line.index })}
                    className="hover:underline"
                    style={{ color: 'var(--color-teal-brand)' }}
                  >
                    Save for later
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold" style={{ color: 'var(--fg-strong)' }}>
                  {money(line.lineTotal)}
                </div>
                {line.qty > 1 && (
                  <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {money(line.product.price)} each
                  </div>
                )}
              </div>
            </article>
          ))}

          {savedLines.length > 0 && (
            <section className="pt-4">
              <h2 className="mb-3 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
                Saved for later ({savedLines.length})
              </h2>
              <div className="space-y-3">
                {savedLines.map((line) => (
                  <article key={`s-${line.id}-${line.variant}`} className="surface flex items-center gap-4 p-3">
                    <ProductImage id={line.id} alt={line.product.title} className="h-16 w-16 shrink-0" sizes="64px" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/p/${line.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--fg-strong)' }}>
                        {line.product.title}
                      </Link>
                      <div className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                        {money(line.product.price)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button
                        onClick={() => dispatch({ type: 'moveToCart', index: line.index })}
                        className="hover:underline"
                        style={{ color: 'var(--color-teal-brand)' }}
                      >
                        Move to cart
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'dropSaved', index: line.index })}
                        className="hover:underline"
                        style={{ color: 'var(--color-rose-sale)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Summary subtotal={subtotal} shipping={shipping} tax={tax} total={total} itemCount={itemCount}>
            <Button as="link" to="/checkout" className="mt-4 w-full" aria-disabled={lines.length === 0}>
              Checkout
            </Button>
            <Link
              to="/s"
              className="mt-3 block text-center text-sm hover:underline"
              style={{ color: 'var(--color-teal-brand)' }}
            >
              Keep shopping
            </Link>
          </Summary>
        </aside>
      </div>
    </div>
  );
}
