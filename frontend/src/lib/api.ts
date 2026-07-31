const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "nvs-token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  token?: string;

  user?: T;
  data?: T;

  addresses?: T;
  address?: T;

  wishlist?: T;
  cart?: T;
}

interface User {
  id: string;
  name: string;
  email: string;
}

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
}

export interface AddressItem {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CartItem {
  productId: string;
  qty: number;
}

const cache = {
  products: new Map<string, ProductItem[]>(),
  categories: new Map<string, Category[]>(),
};

async function request<T>(
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
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  async register(name: string, email: string, password: string) {
    const res = await request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (res.token) {
      saveToken(res.token);
    }

    return res;
  },

  async login(email: string, password: string) {
    const res = await request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
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
};

export const addressesApi = {
  async getAll(): Promise<AddressItem[]> {
    const res = await request<AddressItem[]>("/addresses", {
      method: "GET",
    });

    return res.addresses ?? [];
  },

  async create(data: {
    label: string;
    addressLine: string;
    city: string;
    pincode: string;
    isDefault?: boolean;
  }): Promise<AddressItem> {
    const res = await request<AddressItem>("/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.address) {
      throw new Error("Failed to save address");
    }

    return res.address;
  },

  async delete(id: string) {
    return request(`/addresses/${id}`, {
      method: "DELETE",
    });
  },
};

export const wishlistApi = {
  async getAll(): Promise<string[]> {
    const res = await request<string[]>("/wishlist", {
      method: "GET",
    });

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
    return request(`/wishlist/${productId}`, {
      method: "DELETE",
    });
  },
};

export const cartApi = {
  async getAll(): Promise<CartItem[]> {
    const res = await request<CartItem[]>("/cart", {
      method: "GET",
    });

    return res.cart ?? [];
  },

  async add(productId: string, qty = 1) {
    return request("/cart", {
      method: "POST",
      body: JSON.stringify({
        productId,
        qty,
      }),
    });
  },

  async update(productId: string, qty: number) {
    return request(`/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({
        qty,
      }),
    });
  },

  async remove(productId: string) {
    return request(`/cart/${productId}`, {
      method: "DELETE",
    });
  },

  async clear() {
    return request("/cart", {
      method: "DELETE",
    });
  },
};

export const productsApi = {
  async getByMetal(metal: "Gold" | "Silver") {
    if (cache.products.has(metal)) {
      return cache.products.get(metal)!;
    }

    const token = getToken();

    const res = await fetch(`${API_URL}/products?metal=${metal}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load products");
    }

    const products = (data.products || data) as ProductItem[];

    cache.products.set(metal, products);

    return products;
  },

  async getById(id: string): Promise<ProductItem> {
    const token = getToken();

    const res = await fetch(`${API_URL}/products/${id}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Product not found");
    }

    const raw = data.product || data;

    return {
      ...raw,
      weight: raw.weight ?? raw.grossWeight ?? 0,
      description:
        raw.description ??
        raw.desc ??
        raw.details ??
        "",
    };
  },
};

export const categoriesApi = {
  async getByMetal(metal: "Gold" | "Silver") {
    if (cache.categories.has(metal)) {
      return cache.categories.get(metal)!;
    }

    const token = getToken();

    const res = await fetch(`${API_URL}/categories?metal=${metal}`, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load categories");
    }

    const categories = (data.categories || data) as Category[];

    cache.categories.set(metal, categories);

    return categories;
  },
};

export function clearApiCache() {
  cache.products.clear();
  cache.categories.clear();
}