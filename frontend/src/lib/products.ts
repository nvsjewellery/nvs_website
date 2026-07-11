import type { Product } from "./store";
import n1 from "@/assets/p-necklace-1.jpg";
import n2 from "@/assets/p-necklace-2.jpg";
import n3 from "@/assets/p-necklace-3.jpg";
import b1 from "@/assets/p-bangle-1.jpg";
import r1 from "@/assets/p-ring-1.jpg";
import e1 from "@/assets/p-earring-1.jpg";
import d1 from "@/assets/p-diamond-1.jpg";
import d2 from "@/assets/p-diamond-2.jpg";
import pt1 from "@/assets/p-platinum-1.jpg";
import s1 from "@/assets/p-silver-1.jpg";
import s2 from "@/assets/p-silver-2.jpg";
import rose1 from "@/assets/p-rose-1.jpg";
import pen1 from "@/assets/p-pendant-1.jpg";
import mg1 from "@/assets/p-mangal-1.jpg";
import ch1 from "@/assets/p-chain-1.jpg";

export const PRODUCTS: Product[] = [
  // Gold
  { id: "g-nk-1", name: "Meenakari Temple Necklace", metal: "Gold", sub: "Necklaces", purity: "22K", weight: 42.5, price: 432320, gemstone: "None", image: n1 },
  { id: "g-nk-2", name: "Antique Layered Haram", metal: "Gold", sub: "Necklaces", purity: "22K", weight: 68.2, price: 686240, gemstone: "None", image: n2 },
  { id: "g-nk-3", name: "Kundan Choker Set", metal: "Gold", sub: "Necklaces", purity: "22K", weight: 55.0, price: 559800, gemstone: "Diamond", image: n3 },
  { id: "g-bn-1", name: "Kada Broad Bangle", metal: "Gold", sub: "Bangles", purity: "22K", weight: 32.0, price: 322560, gemstone: "None", image: b1 },
  { id: "g-rn-1", name: "Filigree Ring", metal: "Gold", sub: "Rings", purity: "18K", weight: 4.2, price: 28840, gemstone: "None", image: r1 },
  { id: "g-er-1", name: "Jhumka Drops", metal: "Gold", sub: "Earrings", purity: "22K", weight: 8.6, price: 68680, gemstone: "None", image: e1 },
  { id: "g-ch-1", name: "Rope Chain Classic", metal: "Gold", sub: "Chains", purity: "22K", weight: 18.4, price: 148640, gemstone: "None", image: ch1 },
  { id: "g-pd-1", name: "Om Pendant", metal: "Gold", sub: "Pendants", purity: "22K", weight: 4.8, price: 38520, gemstone: "None", image: pen1 },
  { id: "g-mg-1", name: "Traditional Mangalsutra", metal: "Gold", sub: "Mangalsutra", purity: "22K", weight: 24.5, price: 197840, gemstone: "None", image: mg1 },
  { id: "g-an-1", name: "Payal Ghungroo Anklet", metal: "Gold", sub: "Anklets", purity: "22K", weight: 22.0, price: 178640, gemstone: "None", image: s2 },
  { id: "g-np-1", name: "Delicate Nose Pin", metal: "Gold", sub: "Nose Pins", purity: "18K", weight: 0.6, price: 4820, gemstone: "None", image: r1 },
  { id: "g-br-1", name: "Woven Gold Bracelet", metal: "Gold", sub: "Bracelets", purity: "22K", weight: 14.2, price: 114720, gemstone: "None", image: ch1 },

  // Silver
  { id: "s-rn-1", name: "Oxidized Silver Ring", metal: "Silver", sub: "Rings", purity: "92.5", weight: 6.8, price: 1420, gemstone: "None", image: s1 },
  { id: "s-an-1", name: "Payal Ghungroo Anklet", metal: "Silver", sub: "Anklets", purity: "92.5", weight: 42.0, price: 5860, gemstone: "None", image: s2 },
  { id: "s-ch-1", name: "Silver Rope Chain", metal: "Silver", sub: "Chains", purity: "92.5", weight: 18.0, price: 2480, gemstone: "None", image: ch1 },
  { id: "s-br-1", name: "Silver Cuff Bracelet", metal: "Silver", sub: "Bracelets", purity: "92.5", weight: 22.0, price: 3120, gemstone: "None", image: ch1 },
  { id: "s-er-1", name: "Silver Filigree Earring", metal: "Silver", sub: "Earrings", purity: "92.5", weight: 6.2, price: 1240, gemstone: "None", image: e1 },
  { id: "s-pd-1", name: "Silver Om Pendant", metal: "Silver", sub: "Pendants", purity: "92.5", weight: 3.4, price: 780, gemstone: "None", image: pen1 },
  { id: "s-np-1", name: "Silver Nose Pin", metal: "Silver", sub: "Nose Pins", purity: "92.5", weight: 0.4, price: 320, gemstone: "None", image: s1 },

  // Platinum
  { id: "p-rn-1", name: "Classic Platinum Band", metal: "Platinum", sub: "Rings", purity: "PT950", weight: 5.8, price: 24680, gemstone: "None", image: pt1 },
  { id: "p-ch-1", name: "Platinum Chain Sleek", metal: "Platinum", sub: "Chains", purity: "PT950", weight: 12.5, price: 52840, gemstone: "None", image: ch1 },
  { id: "p-br-1", name: "Platinum Link Bracelet", metal: "Platinum", sub: "Bracelets", purity: "PT950", weight: 18.0, price: 76240, gemstone: "None", image: ch1 },

  // Diamond
  { id: "d-rn-1", name: "Solitaire Diamond Ring", metal: "Diamond", sub: "Rings", purity: "VVS1", weight: 3.8, price: 145820, gemstone: "Diamond", image: d1 },
  { id: "d-rn-2", name: "Halo Diamond Ring", metal: "Diamond", sub: "Rings", purity: "VS1", weight: 4.2, price: 128640, gemstone: "Diamond", image: d2 },
  { id: "d-er-1", name: "Diamond Stud Earrings", metal: "Diamond", sub: "Earrings", purity: "VS2", weight: 2.4, price: 68420, gemstone: "Diamond", image: d1 },
  { id: "d-pd-1", name: "Diamond Halo Pendant", metal: "Diamond", sub: "Pendants", purity: "VVS1", weight: 3.0, price: 89240, gemstone: "Diamond", image: pen1 },
  { id: "d-nk-1", name: "Diamond Riviera Necklace", metal: "Diamond", sub: "Necklaces", purity: "VS1", weight: 14.8, price: 486240, gemstone: "Diamond", image: n3 },

  // Rose Gold
  { id: "rg-pd-1", name: "Rose Gold Loop Pendant", metal: "Rose Gold", sub: "Pendants", purity: "18K", weight: 3.2, price: 21840, gemstone: "None", image: rose1 },
  { id: "rg-rn-1", name: "Rose Gold Twist Ring", metal: "Rose Gold", sub: "Rings", purity: "18K", weight: 3.6, price: 24560, gemstone: "None", image: rose1 },
];

export const CATEGORY_TREE = {
  Gold: ["Rings", "Chains", "Necklaces", "Earrings", "Bangles", "Bracelets", "Pendants", "Mangalsutra", "Anklets", "Nose Pins"],
  Silver: ["Rings", "Chains", "Anklets", "Bracelets", "Earrings", "Pendants", "Nose Pins"],
  Platinum: ["Rings", "Chains", "Bracelets"],
  Diamond: ["Rings", "Earrings", "Pendants", "Necklaces"],
  "Rose Gold": ["Rings", "Pendants"],
} as const;

export const PURITIES: Record<string, string[]> = {
  Gold: ["22K", "18K"],
  Silver: ["92.5"],
  Platinum: ["PT950"],
  Diamond: ["VVS1", "VS1", "VS2"],
  "Rose Gold": ["18K"],
};

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export function metalSlug(m: string) {
  return m.toLowerCase().replace(/\s+/g, "-");
}
