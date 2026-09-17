import { Link } from 'react-router-dom';
import { money } from '../store/StoreContext';

export function Stars({ rating, size = 14 }) {
  const pct = (rating / 5) * 100;
  return (
    <span className="inline-flex items-center gap-1 align-middle" title={`${rating} out of 5`}>
      <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-hidden="true">
        <span style={{ color: 'var(--border-soft)' }}>★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden whitespace-nowrap"
          style={{ width: `${pct}%`, color: 'var(--color-amber-brand)' }}
        >
          ★★★★★
        </span>
      </span>
      <span className="sr-only">{rating} out of 5 stars</span>
    </span>
  );
}

export function Price({ value, list, size = 'md' }) {
  const big = size === 'lg';
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={big ? 'text-3xl font-semibold' : 'text-lg font-semibold'}
        style={{ color: 'var(--fg-strong)' }}
      >
        {money(value)}
      </span>
      {list && list > value && (
        <>
          <span className="text-sm line-through" style={{ color: 'var(--fg-muted)' }}>
            {money(list)}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-rose-sale)' }}>
            −{Math.round(((list - value) / list) * 100)}%
          </span>
        </>
      )}
    </span>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { background: 'var(--bg-sunken)', color: 'var(--fg-muted)' },
    fast: { background: 'color-mix(in srgb, var(--color-teal-brand) 14%, transparent)', color: 'var(--color-teal-brand)' },
    warn: { background: 'color-mix(in srgb, var(--color-rose-sale) 12%, transparent)', color: 'var(--color-rose-sale)' },
  };
  return (
    <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={tones[tone]}>
      {children}
    </span>
  );
}

export function Button({ as = 'button', variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles = {
    primary: { background: 'var(--color-amber-brand)', color: '#2a1c06' },
    dark: { background: 'var(--color-ink-900)', color: '#fff' },
    ghost: { background: 'var(--bg-sunken)', color: 'var(--fg-body)' },
  };
  const Cmp = as === 'link' ? Link : as;
  return <Cmp className={`${base} ${className}`} style={styles[variant]} {...props} />;
}

export function Stock({ count, days }) {
  if (count === 0) {
    return (
      <span className="text-sm font-medium" style={{ color: 'var(--color-rose-sale)' }}>
        Out of stock — restocking soon
      </span>
    );
  }
  return (
    <span className="text-sm" style={{ color: 'var(--color-teal-brand)' }}>
      In stock
      {count <= 10 && <span style={{ color: 'var(--fg-muted)' }}> · only {count} left</span>}
      <span style={{ color: 'var(--fg-muted)' }}>
        {' '}
        · arrives in {days} {days === 1 ? 'day' : 'days'}
      </span>
    </span>
  );
}
