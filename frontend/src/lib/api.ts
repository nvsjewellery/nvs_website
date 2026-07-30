const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  user?: T;
  data?: T;
  addresses?: T;
  address?: T;
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

// In-memory cache store
const cache = {
  products: new Map<string, ProductItem[]>(),
  categories: new Map<string, Category[]>(),
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Preserves cookies across reloads
    headers: {
      "Content-Type": "application/json",
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
  register: (name: string, email: string, password: string) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<null>("/auth/logout", { method: "POST" }),

  getMe: () => request<User>("/auth/me", { method: "GET" }),
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

export const productsApi = {
  getByMetal: async (metal: "Gold" | "Silver") => {
    if (cache.products.has(metal)) {
      return cache.products.get(metal)!;
    }

    const res = await fetch(`${API_URL}/products?metal=${metal}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load products");
    
    const products = (data.products || data) as ProductItem[];
    cache.products.set(metal, products);
    return products;
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Product not found");
    
    const rawProduct = data.product || data;
    return {
      ...rawProduct,
      weight: rawProduct.weight ?? rawProduct.grossWeight ?? 0,
      description: rawProduct.description ?? rawProduct.desc ?? rawProduct.details ?? "",
    } as ProductItem;
  },
};

export const categoriesApi = {
  getByMetal: async (metal: "Gold" | "Silver") => {
    if (cache.categories.has(metal)) {
      return cache.categories.get(metal)!;
    }

    const res = await fetch(`${API_URL}/categories?metal=${metal}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load categories");
    
    const categories = (data.categories || data) as Category[];
    cache.categories.set(metal, categories);
    return categories;
  },
};

export function clearApiCache() {
  cache.products.clear();
  cache.categories.clear();
}