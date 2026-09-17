import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Search from './pages/Search';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderPlaced from './pages/OrderPlaced';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname, search]);
  return null;
}

function Footer() {
  return (
    <footer className="mt-16" style={{ background: 'var(--color-ink-950)', color: '#cbd5e1' }}>
      <div
        className="mx-auto max-w-[1400px] px-4 py-10"
        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h4 className="mb-2 font-semibold text-white">Bazaar</h4>
            <p className="text-sm leading-relaxed text-white/60">
              A storefront rebuild, built as a take-home exercise. Not affiliated with any real retailer —
              every product, price and review count here is invented.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-white">What we changed</h4>
            <ul className="space-y-1 text-sm text-white/60">
              <li>Shipping and tax shown before checkout</li>
              <li>No countdown timers or fake scarcity</li>
              <li>One clear delivery date per item</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-white">Browse</h4>
            <ul className="space-y-1 text-sm text-white/60">
              <li>
                <Link to="/s" className="hover:text-white hover:underline">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white hover:underline">
                  Your orders
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white hover:underline">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s" element={<Search />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:id" element={<OrderPlaced />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-2xl px-4 py-24 text-center">
                <h1 className="mb-3 text-3xl font-bold" style={{ color: 'var(--fg-strong)' }}>
                  Page not found
                </h1>
                <Link to="/" className="underline">
                  Back to the store
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
