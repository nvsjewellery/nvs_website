import type { Product } from "./store";

export const CATEGORY_TREE = {
  Gold: ["Rings", "Chains", "Necklaces", "Earrings", "Bangles", "Bracelets", "Pendants", "Mangalsutra", "Anklets", "Nose Pins"],
  Silver: ["Rings", "Chains", "Anklets", "Bracelets", "Earrings", "Pendants", "Nose Pins"],
} as const;

export const PURITIES: Record<string, string[]> = {
  Gold: ["22K", "18K"],
  Silver: ["92.5"],
};

export function metalSlug(m: string) {
  return m.toLowerCase().replace(/\s+/g, "-");
}