const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // sends the httpOnly cookie
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

export const productsApi = {
  getByMetal: async (metal: "Gold" | "Silver") => {
    const res = await fetch(`${API_URL}/products?metal=${metal}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load products");
    return data.products as Array<{
      id: string; name: string; metal: string; sub: string; purity: string;
      weight: number; price: number; gemstone: string; image: string;
    }>;
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Product not found");
    return data.product as {
      id: string; name: string; metal: string; sub: string; purity: string;
      weight: number; price: number; gemstone: string; image: string;
    };
  },
};

export const categoriesApi = {
  getByMetal: async (metal: "Gold" | "Silver") => {
    const res = await fetch(`${API_URL}/categories?metal=${metal}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load categories");
    return (data.categories || data) as Category[];
  },
};