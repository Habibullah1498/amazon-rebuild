import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, money } from '../store/StoreContext';
import { Summary } from './Cart';
import { Button } from '../components/Bits';
import ProductArt from '../components/ProductArt';

const DELIVERY = [
  { id: 'standard', label: 'Standard', detail: '3–5 days', cost: 0 },
  { id: 'express', label: 'Express', detail: '2 days', cost: 6.99 },
  { id: 'nextday', label: 'Next day', detail: 'Tomorrow if ordered before 6pm', cost: 12.99 },
];

function Field({ label, value, onChange, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: 'var(--fg-body)' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--fg-body)',
          borderColor: error ? 'var(--color-rose-sale)' : 'var(--border-soft)',
        }}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs" style={{ color: 'var(--color-rose-sale)' }}>
          {error}
        </span>
      )}
    </label>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { lines, subtotal, tax, itemCount, dispatch } = useStore();
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', postcode: '', card: '' });
  const [speed, setSpeed] = useState('standard');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const shippingCost = DELIVERY.find((d) => d.id === speed)?.cost ?? 0;
  const freeShipping = subtotal >= 60 && speed === 'standard';
  const shipping = freeShipping ? 0 : shippingCost;
  const total = +(subtotal + shipping + tax).toFixed(2);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
          There’s nothing to check out
        </h1>
        <Button as="link" to="/s">
          Browse products
        </Button>
      </div>
    );
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'We need a name for the parcel';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email for the receipt';
    if (!form.address.trim()) next.address = 'Enter a street address';
    if (!form.city.trim()) next.city = 'Enter a city';
    if (!form.postcode.trim()) next.postcode = 'Enter a postcode';
    if (form.card.replace(/\s/g, '').length < 12) next.card = 'Enter any 12+ digits — this is a demo, do not use a real card';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function placeOrder(e) {
    e.preventDefault();
    if (!validate()) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setPlacing(true);
    const order = {
      id: `BZ-${Date.now().toString().slice(-8)}`,
      placedAt: new Date().toISOString(),
      items: lines.map((l) => ({
        id: l.id,
        title: l.product.title,
        qty: l.qty,
        variant: l.variant,
        price: l.product.price,
        art: l.product.art,
        tint: l.product.tint,
      })),
      name: form.name,
      email: form.email,
      address: `${form.address}, ${form.city} ${form.postcode}`,
      delivery: DELIVERY.find((d) => d.id === speed),
      subtotal,
      shipping,
      tax,
      total,
    };
    // Simulated network latency so the button state is visible.
    setTimeout(() => {
      dispatch({ type: 'placeOrder', order });
      navigate(`/order/${order.id}`);
    }, 700);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
        Checkout
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--fg-muted)' }}>
        This is a demo store. No payment is taken and nothing is shipped —{' '}
        <strong style={{ color: 'var(--fg-body)' }}>do not enter real card details.</strong>
      </p>

      <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="surface p-5">
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
              1. Delivery address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Field label="Email" value={form.email} onChange={set('email')} error={errors.email} type="email" autoComplete="email" />
              <div className="sm:col-span-2">
                <Field label="Street address" value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
              </div>
              <Field label="City" value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
              <Field label="Postcode" value={form.postcode} onChange={set('postcode')} error={errors.postcode} autoComplete="postal-code" />
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
              2. Delivery speed
            </h2>
            <div className="space-y-2">
              {DELIVERY.map((d) => {
                const free = d.id === 'standard' && subtotal >= 60;
                return (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                    style={{ borderColor: speed === d.id ? 'var(--color-teal-brand)' : 'var(--border-soft)' }}
                  >
                    <input type="radio" name="speed" checked={speed === d.id} onChange={() => setSpeed(d.id)} />
                    <span className="flex-1">
                      <span className="block text-sm font-medium" style={{ color: 'var(--fg-strong)' }}>
                        {d.label}
                      </span>
                      <span className="block text-xs" style={{ color: 'var(--fg-muted)' }}>
                        {d.detail}
                      </span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color: free ? 'var(--color-teal-brand)' : 'var(--fg-body)' }}>
                      {free ? 'Free' : d.cost === 0 ? 'Free' : money(d.cost)}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
              3. Payment
            </h2>
            <Field
              label="Card number (demo — use any digits)"
              value={form.card}
              onChange={set('card')}
              error={errors.card}
              inputMode="numeric"
              placeholder="4242 4242 4242"
              autoComplete="off"
            />
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              No card is charged and nothing is transmitted anywhere — this form only writes to your own
              browser’s local storage. There are no pre-ticked extras, no warranty upsell and no subscription
              hidden in this step.
            </p>
          </section>

          <section className="surface p-5">
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--fg-strong)' }}>
              4. Review
            </h2>
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={`${l.id}-${l.variant}`} className="flex items-center gap-3">
                  <ProductArt art={l.product.art} tint={l.product.tint} className="h-12 w-12 shrink-0" />
                  <span className="min-w-0 flex-1 text-sm" style={{ color: 'var(--fg-body)' }}>
                    {l.product.title}
                    {l.variant && <span style={{ color: 'var(--fg-muted)' }}> · {l.variant}</span>}
                    <span style={{ color: 'var(--fg-muted)' }}> × {l.qty}</span>
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--fg-strong)' }}>
                    {money(l.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Summary subtotal={subtotal} shipping={shipping} tax={tax} total={total} itemCount={itemCount}>
            <Button type="submit" disabled={placing} className="mt-4 w-full">
              {placing ? 'Placing order…' : `Place order · ${money(total)}`}
            </Button>
            <Link to="/cart" className="mt-3 block text-center text-sm hover:underline" style={{ color: 'var(--color-teal-brand)' }}>
              Back to cart
            </Link>
          </Summary>
        </aside>
      </form>
    </div>
  );
}
