import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

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
type User = { id: string; name: string; email: string };
type State = {
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  authChecked: boolean; // true once we've asked the backend "am I logged in?"
};

const KEY = "nvs-store-v1";
let state: State = { cart: [], wishlist: [], user: null, authChecked: false };

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // never trust cached user from localStorage as the source of truth —
      // only cart/wishlist persist locally, user comes from the server
      state = { ...state, cart: parsed.cart ?? [], wishlist: parsed.wishlist ?? [] };
    }
  } catch {}
}

const listeners = new Set<() => void>();
function emit() {
  if (typeof window !== "undefined") {
    try {
      // only persist cart/wishlist locally — user session lives in the httpOnly cookie
      localStorage.setItem(KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist }));
    } catch {}
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
const getSnapshot = () => state;

// Hoisted to a stable constant — a new object literal here on every call
// makes useSyncExternalStore think the snapshot always changed, causing
// an infinite render loop warning.
const SERVER_SNAPSHOT: State = { cart: [], wishlist: [], user: null, authChecked: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

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

  // Real backend calls now — all throw on failure, caller handles the error
  async register(name: string, email: string, password: string) {
    const res = await api.register(name, email, password);
    if (res.user) {
      state = { ...state, user: res.user, authChecked: true };
      emit();
    }
  },
  async signIn(email: string, password: string) {
    const res = await api.login(email, password);
    if (res.user) {
      state = { ...state, user: res.user, authChecked: true };
      emit();
    }
  },
  async signOut() {
    try {
      await api.logout();
    } finally {
      state = { ...state, user: null };
      emit();
    }
  },
  // Call once on app load to check if a valid session cookie already exists
  async checkAuth() {
    try {
      const res = await api.getMe();
      state = { ...state, user: res.user ?? null, authChecked: true };
    } catch {
      state = { ...state, user: null, authChecked: true };
    }
    emit();
  },
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