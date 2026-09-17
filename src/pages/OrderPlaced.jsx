import { useParams, Link } from 'react-router-dom';
import { useStore, money } from '../store/StoreContext';
import ProductImage from '../components/ProductImage';
import { Button } from '../components/Bits';

export default function OrderPlaced() {
  const { id } = useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          We can’t find that order
        </h1>
        <Button as="link" to="/orders">
          See your orders
        </Button>
      </div>
    );
  }

  const arrival = new Date(order.placedAt);
  arrival.setDate(arrival.getDate() + (order.delivery?.id === 'nextday' ? 1 : order.delivery?.id === 'express' ? 2 : 4));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="surface p-8 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: 'color-mix(in srgb, var(--color-teal-brand) 16%, transparent)', color: 'var(--color-teal-brand)' }}
        >
          ✓
        </div>
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          Order placed
        </h1>
        <p className="mb-1" style={{ color: 'var(--fg-muted)' }}>
          Order <span style={{ color: 'var(--fg-body)' }}>{order.id}</span> · a receipt is on its way to {order.email}
        </p>
        <p className="mb-6 text-lg font-semibold" style={{ color: 'var(--color-teal-brand)' }}>
          Arriving {arrival.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <div className="mb-6 space-y-3 text-left">
          {order.items.map((item) => (
            <div key={`${item.id}-${item.variant}`} className="flex items-center gap-3">
              <ProductImage id={item.id} alt={item.title} className="h-12 w-12 shrink-0" sizes="48px" />
              <span className="min-w-0 flex-1 text-sm" style={{ color: 'var(--fg-body)' }}>
                <Link to={`/p/${item.id}`} className="hover:underline">
                  {item.title}
                </Link>
                <span style={{ color: 'var(--fg-muted)' }}> × {item.qty}</span>
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--fg-strong)' }}>
                {money(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        <dl className="mb-6 space-y-1 text-left text-sm">
          <div className="flex justify-between">
            <dt style={{ color: 'var(--fg-muted)' }}>Shipping to</dt>
            <dd style={{ color: 'var(--fg-body)' }}>{order.address}</dd>
          </div>
          <div className="flex justify-between">
            <dt style={{ color: 'var(--fg-muted)' }}>Delivery</dt>
            <dd style={{ color: 'var(--fg-body)' }}>{order.delivery?.label}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt style={{ color: 'var(--fg-strong)' }}>Total paid</dt>
            <dd style={{ color: 'var(--fg-strong)' }}>{money(order.total)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap justify-center gap-3">
          <Button as="link" to="/orders" variant="dark">
            View your orders
          </Button>
          <Button as="link" to="/s" variant="ghost">
            Keep shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
