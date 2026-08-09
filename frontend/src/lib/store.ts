import { useSyncExternalStore } from "react";
import {
  api,
  wishlistApi,
  cartApi,
} from "@/lib/api";

/* =========================================================
   PRODUCT
========================================================= */

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

/* =========================================================
   CART
========================================================= */

export type CartItem = {
  productId: string;
  qty: number;
};

/* =========================================================
   USER
========================================================= */

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

/* =========================================================
   STATE
========================================================= */

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

/* =========================================================
   LISTENERS
========================================================= */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

/* =========================================================
   SERVER SNAPSHOT
========================================================= */

const SERVER_SNAPSHOT: State = {
  cart: [],
  wishlist: [],
  user: null,
  authChecked: false,
};

const getServerSnapshot = () =>
  SERVER_SNAPSHOT;

/* =========================================================
   STORE HOOK
========================================================= */

export function useStore<T>(
  selector: (state: State) => T
): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot())
  );
}

/* =========================================================
   ACTIONS
========================================================= */

export const actions = {
  /* =======================================================
     ADD TO CART
  ======================================================= */

  async addToCart(
    productId: string,
    qty = 1
  ) {
    if (!state.user) {
      return;
    }

    await cartApi.add(
      productId,
      qty
    );

    state.cart =
      await cartApi.getAll();

    emit();
  },

  /* =======================================================
     UPDATE CART QUANTITY
  ======================================================= */

  async updateQty(
    productId: string,
    qty: number
  ) {
    if (!state.user) {
      return;
    }

    if (qty <= 0) {
      await cartApi.remove(
        productId
      );
    } else {
      await cartApi.update(
        productId,
        qty
      );
    }

    state.cart =
      await cartApi.getAll();

    emit();
  },

  /* =======================================================
     REMOVE FROM CART
  ======================================================= */

  async removeFromCart(
    productId: string
  ) {
    if (!state.user) {
      return;
    }

    await cartApi.remove(
      productId
    );

    state.cart =
      await cartApi.getAll();

    emit();
  },

  /* =======================================================
     CLEAR CART
  ======================================================= */

  async clearCart() {
    if (!state.user) {
      return;
    }

    await cartApi.clear();

    state.cart = [];

    emit();
  },

  /* =======================================================
     TOGGLE WISHLIST
  ======================================================= */

  async toggleWishlist(
    productId: string
  ) {
    if (!state.user) {
      return;
    }

    if (
      state.wishlist.includes(
        productId
      )
    ) {
      await wishlistApi.remove(
        productId
      );
    } else {
      await wishlistApi.add(
        productId
      );
    }

    state.wishlist =
      await wishlistApi.getAll();

    emit();
  },

  /* =======================================================
     REGISTER
  ======================================================= */

  async register(
    name: string,
    email: string,
    password: string
  ) {
    const res =
      await api.register(
        name,
        email,
        password
      );

    if (!res.user) {
      return;
    }

    state.user = res.user;
    state.authChecked = true;

    const [cart, wishlist] =
      await Promise.all([
        cartApi.getAll(),
        wishlistApi.getAll(),
      ]);

    state.cart = cart;
    state.wishlist = wishlist;

    emit();
  },

  /* =======================================================
     SIGN IN
  ======================================================= */

  async signIn(
    email: string,
    password: string
  ) {
    const res =
      await api.login(
        email,
        password
      );

    if (!res.user) {
      return;
    }

    state.user = res.user;
    state.authChecked = true;

    const [cart, wishlist] =
      await Promise.all([
        cartApi.getAll(),
        wishlistApi.getAll(),
      ]);

    state.cart = cart;
    state.wishlist = wishlist;

    emit();
  },

  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  async resetPassword(
    token: string,
    password: string
  ) {
    const res =
      await api.resetPassword(
        token,
        password
      );

    if (!res.user) {
      return;
    }

    state.user = res.user;
    state.authChecked = true;

    const [cart, wishlist] =
      await Promise.all([
        cartApi.getAll(),
        wishlistApi.getAll(),
      ]);

    state.cart = cart;
    state.wishlist = wishlist;

    emit();
  },

  /* =======================================================
     SIGN OUT
  ======================================================= */

  async signOut() {
    try {
      await api.logout();
    } catch {
      // Ignore logout API errors.
    }

    state.user = null;
    state.cart = [];
    state.wishlist = [];
    state.authChecked = true;

    emit();
  },

  /* =======================================================
     CHECK AUTH
  ======================================================= */

  async checkAuth() {
    /*
     * Prevent duplicate authentication
     * requests during the same application
     * session.
     */
    if (state.authChecked) {
      return;
    }

    try {
      const res =
        await api.getMe();

      if (!res.user) {
        state.user = null;
        state.cart = [];
        state.wishlist = [];
        state.authChecked = true;

        emit();
        return;
      }

      state.user = res.user;

      /*
       * Fetch cart and wishlist in parallel.
       */
      const [cart, wishlist] =
        await Promise.all([
          cartApi.getAll(),
          wishlistApi.getAll(),
        ]);

      state.cart = cart;
      state.wishlist = wishlist;
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

/* =========================================================
   INITIAL AUTH CHECK
========================================================= */

if (
  typeof window !== "undefined"
) {
  actions.checkAuth();
}

/* =========================================================
   LIVE RATES
========================================================= */

export let LIVE_RATES: Record<
  string,
  number
> = {
  "24K": 14493,
  "22K": 13285,
  "18K": 10870,
  "14K": 8454,
  "9K": 5435,
  PT950: 3450,
  "92.5": 222,
};

/* =========================================================
   SET LIVE RATES
========================================================= */

export function setLiveRates(
  newRates: Record<
    string,
    number
  >
) {
  LIVE_RATES = {
    ...LIVE_RATES,
    ...newRates,
  };

  emit();
}

/* =========================================================
   COMPUTE PRICE BREAKDOWN
========================================================= */

export function computeBreakdown(
  weight: number,
  purity: string,
  makingPct = 12,
  gstPct = 3
) {
  const base24K =
    LIVE_RATES["24K"] ??
    14493;

  let rate =
    LIVE_RATES[purity];

  if (!rate) {
    switch (purity) {
      case "22K":
        rate =
          base24K *
          (22 / 24);
        break;

      case "18K":
        rate =
          base24K *
          (18 / 24);
        break;

      case "14K":
        rate =
          base24K *
          (14 / 24);
        break;

      case "9K":
        rate =
          base24K *
          (9 / 24);
        break;

      default:
        rate = base24K;
    }
  }

  const metalValue =
    Math.round(
      (weight || 0) *
        rate
    );

  const making =
    Math.round(
      metalValue *
        (makingPct / 100)
    );

  const subtotal =
    metalValue + making;

  const gst =
    Math.round(
      subtotal *
        (gstPct / 100)
    );

  const total =
    subtotal + gst;

  return {
    metalValue,
    making,
    gst,
    total,
    makingPct,
    gstPct,
  };
}

/* =========================================================
   FORMAT INR
========================================================= */

export function formatINR(
  amount: number
) {
  return `₹${(
    amount || 0
  ).toLocaleString(
    "en-IN"
  )}`;
}