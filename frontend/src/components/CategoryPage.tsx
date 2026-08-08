import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { categoriesApi, productsApi, type Category } from "@/lib/api";
import type { Product } from "@/lib/store";

interface CategoryPageProps {
  metal: "Gold" | "Silver";
  description: string;
}

// Helper function to safely extract subcategory string from product object
function getSubCategory(p: Product): string {
  if (!p) return "";

  const raw = p as unknown as Record<string, unknown>;

  const val = (
    p.sub ||
    raw.subCategory ||
    raw.category ||
    p.category ||
    ""
  ) as string;

  return val.trim();
}

export function CategoryPage({
  metal,
  description,
}: CategoryPageProps) {
  const searchParams = useSearch({ strict: false }) as { cat?: string };
  const initialCat = searchParams?.cat || "All";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSub, setSelectedSub] = useState(initialCat);
  const [loading, setLoading] = useState(true);

  // Sync selected subcategory if URL parameter changes
  useEffect(() => {
    if (searchParams?.cat) {
      setSelectedSub(searchParams.cat);
    }
  }, [searchParams?.cat]);

  useEffect(() => {
    let cancelled = false;

    // Fetch data
    Promise.all([
      productsApi.getByMetal(metal),
      categoriesApi.getByMetal(metal),
    ])
      .then(([productsData, categoriesData]) => {
        if (!cancelled) {
          setProducts(productsData as Product[]);
          setCategories(categoriesData);
        }
      })
      .catch((err) => {
        console.error("Error loading category data:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [metal]);

  // Safely filter products avoiding undefined property errors
  const filteredProducts =
    selectedSub === "All"
      ? products
      : products.filter(
          (p) =>
            getSubCategory(p).toLowerCase() ===
            selectedSub.toLowerCase()
        );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Page Header */}
        <div className="mb-10">
          <p className="label-caps text-xs text-[color:var(--gold-dark)] uppercase tracking-wider font-semibold">
            NVS Jewellery
          </p>

          <h1 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--espresso)]">
            {metal} Collection
          </h1>

          <p className="text-sm text-[color:var(--muted-foreground)] mt-2 max-w-2xl">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Categories */}
          <aside className="space-y-6">
            <div>
              <h3 className="label-caps text-xs text-[color:var(--gold-dark)] mb-3 uppercase tracking-wider font-semibold">
                Sub-Category
              </h3>

              <div className="space-y-1">
                {/* All Categories Button */}
                <button
                  type="button"
                  onClick={() => setSelectedSub("All")}
                  className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    selectedSub === "All"
                      ? "bg-[color:var(--gold)] text-white"
                      : "hover:bg-[color:var(--cream)] text-[color:var(--espresso)]"
                  }`}
                >
                  All
                </button>

                {/* Dynamic Category Buttons */}
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedSub(cat.name)}
                    className={`w-full cursor-pointer text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedSub.toLowerCase() ===
                      cat.name.toLowerCase()
                        ? "bg-[color:var(--gold)] text-white"
                        : "hover:bg-[color:var(--cream)] text-[color:var(--espresso)]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}

                {!loading && categories.length === 0 && (
                  <p className="text-xs text-[color:var(--muted-foreground)] px-3 py-2">
                    No categories found.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="md:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Showing {filteredProducts.length} product
                {filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>

            {loading && products.length === 0 ? (
              <div className="text-center py-12 text-[color:var(--muted-foreground)]">
                Loading products...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    p={product}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white border border-[color:var(--border)] rounded-2xl">
                <p className="text-[color:var(--muted-foreground)] text-sm">
                  No products found under "{selectedSub}".
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}