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

  // Forgot / Reset Password response
  resetToken?: string;
  resetUrl?: string;

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

export interface DiscountProduct {
  id: string;
}

export interface Discount {
  id: string;

  name?: string | null;
  code?: string | null;

  type: DiscountType;
  target: DiscountTarget;
  kind: DiscountKind;
  value: number;

  metal?: "Gold" | "Silver" | null;
  category?: string | null;
  products?: DiscountProduct[];
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

  async forgotPassword(email: string) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string) {
    const res = await request<User>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });

    if (res.token) {
      saveToken(res.token);
    }

    return res;
  },

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

  getMe() {
    return request<User>("/auth/me", {
      method: "GET",
    });
  },

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