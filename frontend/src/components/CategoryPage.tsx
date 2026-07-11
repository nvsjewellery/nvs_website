import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "./Layout";
import { OrnamentalDivider } from "./OrnamentalDivider";
import { ProductCard } from "./ProductCard";
import { CATEGORY_TREE, PRODUCTS, PURITIES, metalSlug } from "@/lib/products";
import { formatINR } from "@/lib/store";

type Metal = keyof typeof CATEGORY_TREE;

export function CategoryPage({ metal, description }: { metal: Metal; description: string }) {
  const subs = ["All", ...CATEGORY_TREE[metal]];
  const purities = PURITIES[metal] ?? [];
  const [sub, setSub] = useState<string>("All");
  const [pur, setPur] = useState<string[]>([]);
  const [gem, setGem] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sort, setSort] = useState("Featured");

  const products = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.metal === metal);
    if (sub !== "All") list = list.filter((p) => p.sub === sub);
    if (pur.length) list = list.filter((p) => pur.includes(p.purity));
    if (gem.length) list = list.filter((p) => gem.includes(p.gemstone));
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "Price: Low to High") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "Price: High to Low") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "Weight") list = [...list].sort((a, b) => b.weight - a.weight);
    return list;
  }, [metal, sub, pur, gem, maxPrice, sort]);

  const otherMetals = (["Gold","Silver","Platinum","Diamond","Rose Gold"] as const).filter((m) => m !== metal);

  return (
    <Layout>
      <section style={{ backgroundColor: "var(--cream)" }} className="border-b border-[color:var(--gold)]/20">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">NVS Jewellery / {metal}</p>
          <h1 className="font-serif text-4xl md:text-6xl mt-2 text-[color:var(--espresso)]">{metal} Collection</h1>
          <p className="text-[color:var(--muted-foreground)] mt-3 max-w-2xl">{description}</p>
        </div>
      </section>

      <OrnamentalDivider />

      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <aside className="space-y-8">
          <FilterBlock label="Sub-category">
            <div className="flex flex-col">
              {subs.map((s) => (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition ${
                    sub === s ? "bg-[color:var(--cream)] text-[color:var(--gold-dark)] font-semibold" : "text-[color:var(--espresso)] hover:bg-[color:var(--panel)]"
                  }`}
                >{s}</button>
              ))}
            </div>
          </FilterBlock>

          {purities.length > 0 && (
            <FilterBlock label="Purity">
              <PillGroup options={purities} value={pur} onChange={setPur} />
            </FilterBlock>
          )}

          <FilterBlock label="Gemstone">
            <PillGroup options={["Diamond","None"]} value={gem} onChange={setGem} />
          </FilterBlock>

          <FilterBlock label={`Price (Max)`}>
            <input
              type="range"
              min={5000}
              max={1000000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[color:var(--gold)]"
            />
            <p className="text-xs text-[color:var(--muted-foreground)] mt-2">Up to {formatINR(maxPrice)}</p>
          </FilterBlock>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[color:var(--muted-foreground)]">{products.length} products</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-[color:var(--border)] rounded-full px-4 py-2 text-sm bg-white">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Weight</option>
            </select>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-20 text-[color:var(--muted-foreground)]">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          <div className="mt-16">
            <p className="label-caps text-[color:var(--gold-dark)] text-xs mb-4">Explore Other Metals</p>
            <div className="flex flex-wrap gap-2">
              {otherMetals.map((m) => (
                <Link key={m} to={`/${metalSlug(m)}` as string} className="pill-gold-outline">{m}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="label-caps text-[color:var(--gold-dark)] text-xs mb-3">{label}</h4>
      {children}
    </div>
  );
}

function PillGroup({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              on ? "bg-[color:var(--gold)] text-white border-[color:var(--gold)]" : "bg-white border-[color:var(--border)] text-[color:var(--espresso)] hover:border-[color:var(--gold)]"
            }`}
          >{o}</button>
        );
      })}
    </div>
  );
}
