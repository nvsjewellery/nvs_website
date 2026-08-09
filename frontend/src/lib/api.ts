const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_KEY = "nvs-token";

// ============================================================
// TOKEN HELPERS
// ============================================================

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ============================================================
// API RESPONSE TYPE
// ============================================================

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  token?: string;

  user?: T;
  data?: T;

  addresses?: T;
  address?: T;

  wishlist?: T;
  cart?: T;

  // Order-related
  razorpayOrder?: T;
  order?: T;

  // Discount-related
  discounts?: T;
  coupon?: T;
}

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

// ============================================================
// CATEGORY
// ============================================================

export interface Category {
  id: string;
  metal: "Gold" | "Silver";
  name: string;
  slug: string;
  metaTitle?: string;
  metaDesc?: string;
  image?: string;
  sortOrder?: number;
}

// ============================================================
// PRODUCT
// ============================================================

export interface ProductItem {
  id: string;
  name: string;
  metal: string;
  sub?: string;
  category?: string;
  purity: string;

  weight?: number;
  grossWeight?: number;

  price: number;

  gemstone?: string;
  image: string;

  description?: string;
  desc?: string;
  details?: string;

  /*
   * VA / making charge.
   *
   * Discounts are applied ONLY to this amount.
   */
  va?: number;

  making?: number;

  metalValue?: number;
  gst?: number;
}

// ============================================================
// ADDRESS
// ============================================================

export interface AddressItem {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

// ============================================================
// CART
// ============================================================

export interface CartItem {
  productId: string;
  qty: number;
}

// ============================================================
// DISCOUNT
// ============================================================

export type DiscountType =
  | "SEASONAL"
  | "COUPON"
  | "CUSTOMER";

export type DiscountTarget =
  | "PRODUCT"
  | "CATEGORY"
  | "CART"
  | "CUSTOMER";

export type DiscountKind =
  | "percent"
  | "flat";

/*
 * Product reference returned by backend
 * for product-specific discounts.
 */
export interface DiscountProduct {
  id: string;
}

/*
 * Customer-side discount structure.
 *
 * IMPORTANT:
 *
 * Seasonal PRODUCT discount:
 *   products = [{ id: "..." }]
 *
 * Seasonal CATEGORY discount:
 *   category = "Earrings"
 *
 * Coupon PRODUCT discount:
 *   products = [{ id: "..." }]
 *
 * Coupon CART discount:
 *   target = "CART"
 *
 * Customer discount:
 *   target = "CUSTOMER"
 */
export interface Discount {
  id: string;

  name?: string | null;
  code?: string | null;

  type: DiscountType;

  target: DiscountTarget;

  kind: DiscountKind;

  /*
   * Discount value.
   *
   * percent:
   *   10 = 10%
   *
   * flat:
   *   500 = ₹500
   *
   * IMPORTANT:
   * Backend applies this ONLY against VA /
   * making charges.
   */
  value: number;

  /*
   * Optional metal restriction.
   */
  metal?: "Gold" | "Silver" | null;

  /*
   * Category-specific discount.
   */
  category?: string | null;

  /*
   * Product-specific discount.
   *
   * Backend returns:
   *
   * products: [
   *   { id: "product-id" }
   * ]
   */
  products?: DiscountProduct[];

  /*
   * Customer-specific discount.
   *
   * The backend may return this for
   * available customer discounts.
   */
  userId?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  usageLimit?: number | null;
  usageCount?: number;
}

// ============================================================
// DISCOUNT RESPONSE TYPES
// ============================================================

export interface CouponValidationResponse {
  success: boolean;
  coupon: Discount;
}

export interface AvailableDiscountsResponse {
  success: boolean;
  discounts: Discount[];
}

// ============================================================
// CACHE
// ============================================================

const cache = {
  products: new Map<string, ProductItem[]>(),
  categories: new Map<string, Category[]>(),
};

// ============================================================
// GENERIC REQUEST HELPER
// ============================================================

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data as ApiResponse<T>;
}

// ============================================================
// GENERAL API
// ============================================================

export const api = {
  async post(
    endpoint: string,
    body: unknown = {}
  ): Promise<ApiResponse> {
    return request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------

  async register(
    name: string,
    email: string,
    password: string
  ) {
    const res = await request<User>(
      "/auth/register",
      {
        method: "POST",

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    if (res.token) {
      saveToken(res.token);
    }

    return res;
  },

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  async login(
    email: string,
    password: string
  ) {
    const res = await request<User>(
      "/auth/login",
      {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (res.token) {
      saveToken(res.token);
    }

    return res;
  },

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  async logout() {
    try {
      await request("/auth/logout", {
        method: "POST",
      });
    } finally {
      removeToken();
    }

    return {
      success: true,
    };
  },

  // ----------------------------------------------------------
  // GET CURRENT USER
  // ----------------------------------------------------------

  getMe() {
    return request<User>("/auth/me", {
      method: "GET",
    });
  },

  // ----------------------------------------------------------
  // UPDATE PROFILE
  // ----------------------------------------------------------

  updateProfile(data: {
    phone?: string;
    name?: string;
  }) {
    return request<User>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// ADDRESSES API
// ============================================================

export const addressesApi = {
  async getAll(): Promise<AddressItem[]> {
    const res = await request<AddressItem[]>(
      "/addresses",
      {
        method: "GET",
      }
    );

    return res.addresses ?? [];
  },

  async create(data: {
    label: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }): Promise<AddressItem> {
    const res =
      await request<AddressItem>(
        "/addresses",
        {
          method: "POST",

          body: JSON.stringify(data),
        }
      );

    if (!res.address) {
      throw new Error(
        "Failed to save address"
      );
    }

    return res.address;
  },

  async delete(id: string) {
    return request(`/addresses/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================
// WISHLIST API
// ============================================================

export const wishlistApi = {
  async getAll(): Promise<string[]> {
    const res =
      await request<string[]>(
        "/wishlist",
        {
          method: "GET",
        }
      );

    return res.wishlist ?? [];
  },

  async add(productId: string) {
    return request("/wishlist", {
      method: "POST",

      body: JSON.stringify({
        productId,
      }),
    });
  },

  async remove(productId: string) {
    return request(
      `/wishlist/${productId}`,
      {
        method: "DELETE",
      }
    );
  },
};

// ============================================================
// CART API
// ============================================================

export const cartApi = {
  async getAll(): Promise<CartItem[]> {
    const res =
      await request<CartItem[]>(
        "/cart",
        {
          method: "GET",
        }
      );

    return res.cart ?? [];
  },

  async add(
    productId: string,
    qty = 1
  ) {
    return request("/cart", {
      method: "POST",

      body: JSON.stringify({
        productId,
        qty,
      }),
    });
  },

  async update(
    productId: string,
    qty: number
  ) {
    return request(
      `/cart/${productId}`,
      {
        method: "PUT",

        body: JSON.stringify({
          qty,
        }),
      }
    );
  },

  async remove(productId: string) {
    return request(
      `/cart/${productId}`,
      {
        method: "DELETE",
      }
    );
  },

  async clear() {
    return request("/cart", {
      method: "DELETE",
    });
  },
};

// ============================================================
// PRODUCTS API
// ============================================================

export const productsApi = {
  async getByMetal(
    metal: "Gold" | "Silver"
  ): Promise<ProductItem[]> {
    if (cache.products.has(metal)) {
      return cache.products.get(metal)!;
    }

    const token = getToken();

    const res = await fetch(
      `${API_URL}/products?metal=${metal}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to load products"
      );
    }

    const products =
      (data.products || data) as ProductItem[];

    cache.products.set(
      metal,
      products
    );

    return products;
  },

  async getById(
    id: string
  ): Promise<ProductItem> {
    const token = getToken();

    const res = await fetch(
      `${API_URL}/products/${id}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Product not found"
      );
    }

    const raw =
      data.product || data;

    return {
      ...raw,

      weight:
        raw.weight ??
        raw.grossWeight ??
        0,

      description:
        raw.description ??
        raw.desc ??
        raw.details ??
        "",

      va:
        raw.va ??
        raw.making ??
        0,

      making:
        raw.making ??
        raw.va ??
        0,

      metalValue:
        raw.metalValue ??
        0,

      gst:
        raw.gst ??
        0,
    } as ProductItem;
  },
};

// ============================================================
// CATEGORIES API
// ============================================================

export const categoriesApi = {
  async getByMetal(
    metal: "Gold" | "Silver"
  ): Promise<Category[]> {
    if (cache.categories.has(metal)) {
      return cache.categories.get(metal)!;
    }

    const token = getToken();

    const res = await fetch(
      `${API_URL}/categories?metal=${metal}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          "Failed to load categories"
      );
    }

    const categories =
      (data.categories ||
        data) as Category[];

    cache.categories.set(
      metal,
      categories
    );

    return categories;
  },
};

// ============================================================
// DISCOUNTS API
// ============================================================

export const discountsApi = {
  // ----------------------------------------------------------
  // GET DISCOUNTS AVAILABLE TO CURRENT CUSTOMER
  // ----------------------------------------------------------

  async getAvailable(): Promise<Discount[]> {
    const res =
      await request<Discount[]>(
        "/discounts/available",
        {
          method: "GET",
        }
      );

    return res.discounts ?? [];
  },

  // ----------------------------------------------------------
  // VALIDATE COUPON
  // ----------------------------------------------------------

  async validateCoupon(
    code: string
  ): Promise<Discount> {
    const normalizedCode =
      code.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error(
        "Please enter a coupon code"
      );
    }

    const res =
      await request<Discount>(
        "/discounts/validate-coupon",
        {
          method: "POST",

          body: JSON.stringify({
            code: normalizedCode,
          }),
        }
      );

    if (!res.coupon) {
      throw new Error(
        "Invalid or expired coupon"
      );
    }

    return res.coupon;
  },
};

// ============================================================
// CLEAR API CACHE
// ============================================================

export function clearApiCache() {
  cache.products.clear();
  cache.categories.clear();
}

// ============================================================
// ORDERS
// ============================================================

export interface OrderItemDetail {
  id: string;
  name: string;
  sku: string;
  qty: number;
  sellingPrice: number;
}

export interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItemDetail[];
}

export interface OrderDetail
  extends OrderSummary {
  customerName: string;
  customerLastName: string;
  customerPhone: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  srAwbCode?: string | null;
  srCourierName?: string | null;
}

export const ordersApi = {
  async getAll(): Promise<OrderSummary[]> {
    const res =
      await request<OrderSummary[]>(
        "/orders",
        {
          method: "GET",
        }
      );

    return (
      (res as any).orders ?? []
    );
  },

  async getById(
    orderId: string
  ): Promise<{
    order: OrderDetail;
    tracking: any;
  }> {
    const res =
      await request(
        `/orders/${orderId}`,
        {
          method: "GET",
        }
      );

    return {
      order: (res as any).order,
      tracking: (res as any).tracking,
    };
  },
};