import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  metal: string;
  sub?: string;
  category?: string;
  subCategory?: string;
  purity: string;
  weight: number;
  grossWeight?: number;
  price: number;
  gemstone?: string;
  image: string;
  images?: string[];
  description?: string;
  desc?: string;
  details?: string;
}

type CartItem = { productId: string; qty: number };
type User = { id: string; name: string; email: string };
type State = {
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  authChecked: boolean;
};

const KEY = "nvs-store-v1";
let state: State = { cart: [], wishlist: [], user: null, authChecked: false };

// Load initial state from localStorage on client side
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
        user: parsed.user ?? null,
      };
    }
  } catch {
    // If localStorage parsing fails, stick with initial empty state
  }
}

const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          cart: state.cart,
          wishlist: state.wishlist,
          user: state.user,
        })
      );
    } catch {}
  }
  listeners.forEach((l) => l());
}

// Broadcast initial loaded state right after main thread initialization
if (typeof window !== "undefined") {
  setTimeout(() => emit(), 0);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;
const SERVER_SNAPSHOT: State = { cart: [], wishlist: [], user: null, authChecked: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(getSnapshot()),
    () => sel(getServerSnapshot())
  );
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
      cart:
        qty <= 0
          ? state.cart.filter((c) => c.productId !== productId)
          : state.cart.map((c) => (c.productId === productId ? { ...c, qty } : c)),
    };
    emit();
  },

  removeFromCart(productId: string) {
    state = { ...state, cart: state.cart.filter((c) => c.productId !== productId) };
    emit();
  },

  clearCart() {
    state = { ...state, cart: [] };
    emit();
  },

  toggleWishlist(productId: string) {
    state = {
      ...state,
      wishlist: state.wishlist.includes(productId)
        ? state.wishlist.filter((id) => id !== productId)
        : [...state.wishlist, productId],
    };
    emit();
  },

  async register(name: string, email: string, password: string) {
    const res = await api.register(name, email, password);
    if (res && res.user) {
      state = { ...state, user: res.user, authChecked: true };
      emit();
    }
  },

  async signIn(email: string, password: string) {
    const res = await api.login(email, password);
    if (res && res.user) {
      state = { ...state, user: res.user, authChecked: true };
      emit();
    }
  },

  async signOut() {
    try {
      await api.logout();
    } finally {
      state = { ...state, user: null, authChecked: true };
      emit();
    }
  },

  async checkAuth() {
    try {
      const res = await api.getMe();
      if (res && res.user) {
        state = { ...state, user: res.user, authChecked: true };
      } else {
        state = { ...state, user: null, authChecked: true };
      }
    } catch {
      state = { ...state, user: null, authChecked: true };
    }
    emit();
  },
};

// Check session on startup
if (typeof window !== "undefined") {
  actions.checkAuth();
}

export let LIVE_RATES: Record<string, number> = {
  "24K": 14493,
  "22K": 13285,
  "18K": 10870,
  "14K": 8454,
  "9K": 5435,
  PT950: 3450,
  "92.5": 222,
};

export function setLiveRates(newRates: Record<string, number>) {
  LIVE_RATES = { ...LIVE_RATES, ...newRates };
  emit();
}

export function computeBreakdown(weight: number, purity: string, makingPct = 12, gstPct = 3) {
  const base24K = LIVE_RATES["24K"] ?? 14493;
  let rate = LIVE_RATES[purity];

  if (!rate) {
    if (purity === "22K") rate = base24K * (22 / 24);
    else if (purity === "18K") rate = base24K * (18 / 24);
    else if (purity === "14K") rate = base24K * (14 / 24);
    else if (purity === "9K") rate = base24K * (9 / 24);
    else rate = base24K;
  }

  const metalValue = Math.round((weight || 0) * rate);
  const making = Math.round(metalValue * (makingPct / 100));
  const subtotal = metalValue + making;
  const gst = Math.round(subtotal * (gstPct / 100));
  const total = subtotal + gst;
  return { metalValue, making, gst, total, makingPct, gstPct };
}

export function formatINR(n: number) {
  return "₹" + (n || 0).toLocaleString("en-IN");
}