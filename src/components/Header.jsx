import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import { useStore, money } from '../store/StoreContext';
import ProductImage from './ProductImage';

function suggest(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.blurb.toLowerCase().includes(q)
  ).slice(0, 6);
}

export default function Header() {
  const { itemCount, theme, dispatch } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const boxRef = useRef(null);

  const hits = suggest(query);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // "/" focuses search from anywhere, the way a keyboard-driven store should work.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        boxRef.current?.querySelector('input')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function submit(e) {
    e?.preventDefault();
    setOpen(false);
    navigate(`/s?q=${encodeURIComponent(query.trim())}`);
  }

  function onKeyDown(e) {
    if (!open || hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      setOpen(false);
      navigate(`/p/${hits[cursor].id}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40" style={{ background: 'var(--color-ink-950)' }}>
      <a href="#main" className="sr-only-focusable absolute left-2 top-2 rounded bg-white px-3 py-2 text-sm text-black">
        Skip to content
      </a>
      <div
        className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <Link to="/" className="flex shrink-0 items-center gap-2 text-white">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7h18l-2 12H5z" fill="none" stroke="var(--color-amber-brand)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 7a4 4 0 0 1 8 0" fill="none" stroke="var(--color-amber-brand)" strokeWidth="2" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Bazaar</span>
        </Link>

        <form ref={boxRef} onSubmit={submit} className="relative order-3 w-full md:order-none md:flex-1">
          <div className="flex overflow-hidden rounded-lg">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setCursor(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search Bazaar — press / to focus"
              aria-label="Search products"
              autoComplete="off"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--bg-card)', color: 'var(--fg-body)' }}
            />
            <button
              type="submit"
              className="px-5 text-sm font-semibold"
              style={{ background: 'var(--color-amber-brand)', color: '#2a1c06' }}
            >
              Search
            </button>
          </div>

          {open && hits.length > 0 && (
            <ul
              className="surface absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden p-1 shadow-xl"
              role="listbox"
            >
              {hits.map((p, i) => (
                <li key={p.id}>
                  <Link
                    to={`/p/${p.id}`}
                    onClick={() => setOpen(false)}
                    role="option"
                    aria-selected={i === cursor}
                    className="flex items-center gap-3 rounded-md px-2 py-2"
                    style={{ background: i === cursor ? 'var(--bg-sunken)' : 'transparent' }}
                  >
                    <ProductImage id={p.id} alt="" className="h-9 w-9 shrink-0" sizes="36px" />
                    <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--fg-body)' }}>
                      {p.title}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--fg-strong)' }}>
                      {money(p.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </form>

        <button
          onClick={() => dispatch({ type: 'theme', theme: theme === 'dark' ? 'light' : 'dark' })}
          className="rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <Link to="/orders" className="rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10">
          Orders
        </Link>

        <Link to="/cart" className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-white hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 4h2l2.4 11h9.6l2-8H6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="19" r="1.6" fill="currentColor" />
            <circle cx="17" cy="19" r="1.6" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold">Cart</span>
          {itemCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold"
              style={{ background: 'var(--color-amber-brand)', color: '#2a1c06' }}
            >
              {itemCount}
            </span>
          )}
        </Link>
      </div>

      <nav className="overflow-x-auto" style={{ background: 'var(--color-ink-800)' }}>
        <ul className="mx-auto flex max-w-[1400px] items-center gap-1 px-3 py-1 pr-8 text-sm whitespace-nowrap sm:py-1.5">
          <li>
            <Link to="/s" className="block rounded px-3 py-3 text-white/80 hover:bg-white/10 sm:py-1">
              All
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/s?cat=${c.id}`} className="block rounded px-3 py-3 text-white/80 hover:bg-white/10 sm:py-1">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
