import type { Product } from "./store";

export const CATEGORY_TREE = {
  Gold: [
    "Rings",
    "Chains",
    "Necklaces",
    "Earrings",
    "Bangles",
    "Bracelets",
    "Pendants",
    "Mangalsutra",
    "Anklets",
    "Nose Pins",
  ],
  Silver: [
    "Rings",
    "Chains",
    "Anklets",
    "Bracelets",
    "Earrings",
    "Pendants",
    "Nose Pins",
  ],
} as const;

export const PURITIES: Record<string, string[]> = {
  Gold: ["22K", "18K"],
  Silver: ["92.5"],
};

export function metalSlug(m: string) {
  return m.toLowerCase().replace(/\s+/g, "-");
}

// In-memory cache so cart calculations can read fetched products synchronously
const productCache = new Map<string, Product>();

export function cacheProduct(p: Product) {
  productCache.set(p.id, p);
}

/**
 * Fixes [MISSING_EXPORT] "getProduct" build error in Vite/Rolldown.
 * Returns a cached product or a fallback object while loading.
 */
export function getProduct(id: string): Product {
  if (productCache.has(id)) {
    return productCache.get(id)!;
  }

  // Fallback object so synchronous renders don't crash before the API responds
  return {
    id,
    name: "Loading...",
    metal: "Gold",
    sub: "",
    purity: "22K",
    weight: 0,
    price: 0,
    gemstone: "None",
    image: "",
  };
}