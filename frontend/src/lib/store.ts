import { useSyncExternalStore } from "react";
import { api, wishlistApi, cartApi } from "@/lib/api";

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

export type CartItem = {
  productId: string;
  qty: number;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type State = {
  cart: CartItem[];
  wishlist: string[];
  user: User | null;
  authChecked: boolean;
};

let state: State = {
  cart: [],
  wishlist: [],
  user: null,
  authChecked: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

const SERVER_SNAPSHOT: State = {
  cart: [],
  wishlist: [],
  user: null,
  authChecked: false,
};

const getServerSnapshot = () => SERVER_SNAPSHOT;

export function useStore<T>(selector: (state: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot())
  );
}

export const actions = {
  async addToCart(productId: string, qty = 1) {
    if (!state.user) return;

    await cartApi.add(productId, qty);

    state.cart = await cartApi.getAll();

    emit();
  },

  async updateQty(productId: string, qty: number) {
    if (!state.user) return;

    if (qty <= 0) {
      await cartApi.remove(productId);
    } else {
      await cartApi.update(productId, qty);
    }

    state.cart = await cartApi.getAll();

    emit();
  },

  async removeFromCart(productId: string) {
    if (!state.user) return;

    await cartApi.remove(productId);

    state.cart = await cartApi.getAll();

    emit();
  },

  async clearCart() {
    if (!state.user) return;

    await cartApi.clear();

    state.cart = [];

    emit();
  },

  async toggleWishlist(productId: string) {
    if (!state.user) return;

    if (state.wishlist.includes(productId)) {
      await wishlistApi.remove(productId);
    } else {
      await wishlistApi.add(productId);
    }

    state.wishlist = await wishlistApi.getAll();

    emit();
  },

  async register(name: string, email: string, password: string) {
    const res = await api.register(name, email, password);

    if (!res.user) return;

    state.user = res.user;
    state.authChecked = true;

    state.cart = await cartApi.getAll();
    state.wishlist = await wishlistApi.getAll();

    emit();
  },

  async signIn(email: string, password: string) {
    const res = await api.login(email, password);

    if (!res.user) return;

    state.user = res.user;
    state.authChecked = true;

    state.cart = await cartApi.getAll();
    state.wishlist = await wishlistApi.getAll();

    emit();
  },

  async signOut() {
    try {
      await api.logout();
    } catch {}

    state.user = null;
    state.cart = [];
    state.wishlist = [];
    state.authChecked = true;

    emit();
  },

  async checkAuth() {
    try {
      const res = await api.getMe();

      if (!res.user) {
        state.user = null;
        state.cart = [];
        state.wishlist = [];
        state.authChecked = true;
        emit();
        return;
      }

      state.user = res.user;

      state.cart = await cartApi.getAll();
      state.wishlist = await wishlistApi.getAll();

      state.authChecked = true;

      emit();
    } catch {
      state.user = null;
      state.cart = [];
      state.wishlist = [];
      state.authChecked = true;

      emit();
    }
  },
};

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
  LIVE_RATES = {
    ...LIVE_RATES,
    ...newRates,
  };

  emit();
}

export function computeBreakdown(
  weight: number,
  purity: string,
  makingPct = 12,
  gstPct = 3
) {
  const base24K = LIVE_RATES["24K"] ?? 14493;

  let rate = LIVE_RATES[purity];

  if (!rate) {
    switch (purity) {
      case "22K":
        rate = base24K * (22 / 24);
        break;

      case "18K":
        rate = base24K * (18 / 24);
        break;

      case "14K":
        rate = base24K * (14 / 24);
        break;

      case "9K":
        rate = base24K * (9 / 24);
        break;

      default:
        rate = base24K;
    }
  }

  const metalValue = Math.round((weight || 0) * rate);
  const making = Math.round(metalValue * (makingPct / 100));
  const subtotal = metalValue + making;
  const gst = Math.round(subtotal * (gstPct / 100));
  const total = subtotal + gst;

  return {
    metalValue,
    making,
    gst,
    total,
    makingPct,
    gstPct,
  };
}

export function formatINR(amount: number) {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
}