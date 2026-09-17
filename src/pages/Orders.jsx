import { Link } from 'react-router-dom';
import { useStore, money } from '../store/StoreContext';
import ProductArt from '../components/ProductArt';
import { Button } from '../components/Bits';

function stage(placedAt, delivery) {
  const days = (Date.now() - new Date(placedAt)) / 86400000;
  const window = delivery?.id === 'nextday' ? 1 : delivery?.id === 'express' ? 2 : 4;
  if (days >= window) return { label: 'Delivered', step: 3 };
  if (days >= window / 2) return { label: 'Out for delivery', step: 2 };
  return { label: 'Preparing for dispatch', step: 1 };
}

export default function Orders() {
  const { orders } = useStore();

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          No orders yet
        </h1>
        <p className="mb-6" style={{ color: 'var(--fg-muted)' }}>
          Orders you place will show up here, with tracking.
        </p>
        <Button as="link" to="/s">
          Start browsing
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
        Your orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const st = stage(order.placedAt, order.delivery);
          return (
            <article key={order.id} className="surface overflow-hidden">
              <header
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
                style={{ background: 'var(--bg-sunken)' }}
              >
                <div>
                  <span style={{ color: 'var(--fg-muted)' }}>Order placed </span>
                  <span style={{ color: 'var(--fg-body)' }}>
                    {new Date(order.placedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--fg-muted)' }}>Total </span>
                  <span className="font-semibold" style={{ color: 'var(--fg-strong)' }}>
                    {money(order.total)}
                  </span>
                </div>
                <div style={{ color: 'var(--fg-muted)' }}>{order.id}</div>
              </header>

              <div className="p-5">
                <div className="mb-4">
                  <p className="mb-2 font-semibold" style={{ color: 'var(--color-teal-brand)' }}>
                    {st.label}
                  </p>
                  <div className="flex gap-1" role="img" aria-label={`Status: ${st.label}`}>
                    {[1, 2, 3].map((s) => (
                      <span
                        key={s}
                        className="h-1.5 flex-1 rounded"
                        style={{ background: s <= st.step ? 'var(--color-teal-brand)' : 'var(--bg-sunken)' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={`${item.id}-${item.variant}`} className="flex items-center gap-3">
                      <ProductArt art={item.art} tint={item.tint} className="h-14 w-14 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Link to={`/p/${item.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--fg-strong)' }}>
                          {item.title}
                        </Link>
                        <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                          Qty {item.qty}
                          {item.variant && ` · ${item.variant}`}
                        </div>
                      </div>
                      <Link
                        to={`/p/${item.id}`}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: 'var(--bg-sunken)', color: 'var(--fg-body)' }}
                      >
                        Buy again
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
