import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { findProduct } from '../data/catalog';

const StoreContext = createContext(null);
const KEY = 'bazaar.state.v1';

const EMPTY = { cart: [], saved: [], orders: [], theme: 'light' };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // Private windows and blocked site-data both throw here; the store still works
    // for the session, it just won't survive a reload.
    return EMPTY;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { id, variant = null, qty = 1 } = action;
      const match = (l) => l.id === id && l.variant === variant;
      const existing = state.cart.find(match);
      const cart = existing
        ? state.cart.map((l) => (match(l) ? { ...l, qty: Math.min(l.qty + qty, 20) } : l))
        : [...state.cart, { id, variant, qty }];
      return { ...state, cart };
    }
    case 'setQty': {
      const cart = state.cart
        .map((l, i) => (i === action.index ? { ...l, qty: action.qty } : l))
        .filter((l) => l.qty > 0);
      return { ...state, cart };
    }
    case 'remove':
      return { ...state, cart: state.cart.filter((_, i) => i !== action.index) };
    case 'saveForLater': {
      const line = state.cart[action.index];
      if (!line) return state;
      return {
        ...state,
        cart: state.cart.filter((_, i) => i !== action.index),
        saved: [...state.saved, line],
      };
    }
    case 'moveToCart': {
      const line = state.saved[action.index];
      if (!line) return state;
      return {
        ...state,
        saved: state.saved.filter((_, i) => i !== action.index),
        cart: [...state.cart, line],
      };
    }
    case 'dropSaved':
      return { ...state, saved: state.saved.filter((_, i) => i !== action.index) };
    case 'placeOrder':
      return { ...state, cart: [], orders: [action.order, ...state.orders] };
    case 'theme':
      return { ...state, theme: action.theme };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — carry on in memory */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const value = useMemo(() => {
    const lines = state.cart
      .map((line, index) => {
        const product = findProduct(line.id);
        return product ? { ...line, index, product, lineTotal: product.price * line.qty } : null;
      })
      .filter(Boolean);

    const savedLines = state.saved
      .map((line, index) => {
        const product = findProduct(line.id);
        return product ? { ...line, index, product } : null;
      })
      .filter(Boolean);

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
    // Shown up front rather than revealed at the last checkout step.
    const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 5.99;
    const tax = +(subtotal * 0.0825).toFixed(2);
    const total = +(subtotal + shipping + tax).toFixed(2);

    return {
      ...state,
      lines,
      savedLines,
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
      dispatch,
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
