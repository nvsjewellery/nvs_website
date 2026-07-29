import type { Product } from "./store";

export const PURITIES: Record<string, string[]> = {
  Gold: ["22K", "18K"],
  Silver: ["92.5"],
};

export function metalSlug(m: string) {
  return m.toLowerCase().replace(/\s+/g, "-");
}

const productCache = new Map<string, Product>();

export function cacheProduct(p: Product) {
  productCache.set(p.id, p);
}

export function getProduct(id: string): Product {
  if (productCache.has(id)) {
    return productCache.get(id)!;
  }

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