import { useSyncExternalStore } from "react";

export type Product = {
  id: string;
  name: string;
  metal: "Gold" | "Silver" | "Platinum" | "Diamond" | "Rose Gold";
  sub: string;
  purity: string;
  weight: number;
  price: number;
  gemstone: "Diamond" | "None";
  image: string;
  gallery?: string[];
};

type CartItem = { productId: string; qty: number };
type State = {
  cart: CartItem[];
  wishlist: string[];
  user: { name: string; email: string } | null;
};

const KEY = "nvs-store-v1";
let state: State = { cart: [], wishlist: [], user: null };

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
}

const listeners = new Set<() => void>();
function emit() {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
const getSnapshot = () => state;
const getServerSnapshot = () => ({ cart: [], wishlist: [], user: null } as State);

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(getServerSnapshot()));
}

export const actions = {
  addToCart(productId: string, qty = 1) {
    const existing = state.cart.find((c) => c.productId === productId);
    state = {
      ...state,
      cart: existing
        ? state.cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c))
        : [...state.cart, { productId, qty }],
    };
    emit();
  },
  updateQty(productId: string, qty: number) {
    state = {
      ...state,
      cart: qty <= 0
        ? state.cart.filter((c) => c.productId !== productId)
        : state.cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
    };
    emit();
  },
  removeFromCart(productId: string) {
    state = { ...state, cart: state.cart.filter((c) => c.productId !== productId) };
    emit();
  },
  clearCart() { state = { ...state, cart: [] }; emit(); },
  toggleWishlist(productId: string) {
    state = {
      ...state,
      wishlist: state.wishlist.includes(productId)
        ? state.wishlist.filter((id) => id !== productId)
        : [...state.wishlist, productId],
    };
    emit();
  },
  signIn(email: string) {
    const name = email.split("@")[0].replace(/\W/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Guest";
    state = { ...state, user: { name, email } };
    emit();
  },
  signOut() { state = { ...state, user: null }; emit(); },
};

// Live rates in ₹/gram
export const LIVE_RATES = {
  "22K": 6820,
  "24K": 7440,
  "18K": 5580,
  "PT950": 3450,
  "92.5": 92,
};

export function computeBreakdown(weight: number, purity: string, makingPct = 12, gstPct = 3) {
  const rate = (LIVE_RATES as Record<string, number>)[purity] ?? 6820;
  const metalValue = Math.round(weight * rate);
  const making = Math.round(metalValue * (makingPct / 100));
  const subtotal = metalValue + making;
  const gst = Math.round(subtotal * (gstPct / 100));
  const total = subtotal + gst;
  return { metalValue, making, gst, total, makingPct, gstPct };
}

export function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
