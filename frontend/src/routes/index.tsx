import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ProductCard, SimpleProductCard } from "@/components/ProductCard";
import { metalSlug } from "@/lib/products";
import { productsApi } from "@/lib/api";
import { type Product } from "@/lib/store";
import hero from "@/assets/hero-gold.jpg";
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catBangles from "@/assets/cat-bangles.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catMangalsutra from "@/assets/cat-mangalsutra.jpg";
import catPendants from "@/assets/cat-pendants.jpg";
import catChains from "@/assets/cat-chains.jpg";

export const Route = createFileRoute("/")({ component: Home });

const METALS = [
  { name: "Gold", grad: "linear-gradient(135deg,#f6d47a,#b8912f)" },
  { name: "Silver", grad: "linear-gradient(135deg,#e8e8ea,#a8a8ac)" },
];

const FEATURED = [
  { name: "Necklaces", tag: "Handcrafted heirlooms", img: catNecklaces, span: "lg:col-span-2 lg:row-span-2" },
  { name: "Bangles", tag: "Stacked in tradition", img: catBangles, span: "" },
  { name: "Rings", tag: "Sparkling promises", img: catRings, span: "" },
  { name: "Earrings", tag: "Jhumkas & drops", img: catEarrings, span: "lg:col-span-2" },
  { name: "Mangalsutra", tag: "Sacred bonds", img: catMangalsutra, span: "" },
  { name: "Pendants", tag: "Meaningful charms", img: catPendants, span: "" },
  { name: "Chains", tag: "Everyday classics", img: catChains, span: "" },
];

const QUICK_TYPES = ["Rings","Chains","Earrings","Bangles","Necklaces","Pendants","Bracelets","Mangalsutra"];

function Home() {
  const [tab, setTab] = useState("Rings");
  const [goldProducts, setGoldProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getByMetal("Gold")
      .then((data) => { if (!cancelled) setGoldProducts(data as Product[]); })
      .catch(() => { if (!cancelled) setGoldProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const trending = goldProducts.filter((p) => p.sub === tab).slice(0, 4);
  const explore = goldProducts.filter((p) => ["Necklaces","Bangles","Rings","Earrings","Chains","Pendants"].includes(p.sub)).slice(0, 8);
  const bridalPicks = goldProducts.filter((p) => p.sub === "Necklaces" || p.sub === "Mangalsutra").slice(0, 5);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[500px] overflow-hidden">
        <img src={hero} alt="Gold jewellery" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-xl">
            <p className="label-caps text-[color:var(--gold)] text-xs mb-4">NVS Jewellery Presents</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-white">
              Everyday Gold,<br />
              <span className="text-[color:var(--gold)] italic">Timeless Sparkle</span>
            </h1>
            <p className="mt-5 text-white/80 max-w-md">
              Certified craftsmanship since 1978. Discover heirloom pieces made to be worn every day and passed down for generations.
            </p>
            <Link to="/gold" className="mt-8 pill-gold inline-flex">
              Shop the Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {[0,1,2].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i===0 ? "w-8 bg-[color:var(--gold)]" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
      </section>

      {/* Live Rates */}
      <LiveRatesBar />

      <OrnamentalDivider />

      {/* Shop by Metal */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">Choose Your Metal</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">Shop by Metal</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          {METALS.map((m) => (
            <Link key={m.name} to={`/${metalSlug(m.name)}` as string} className="bg-white border border-[color:var(--border)] rounded-2xl p-6 text-center hover:border-[color:var(--gold)] hover:shadow-md transition group">
              <div className="w-24 h-24 mx-auto rounded-full shadow-inner" style={{ background: m.grad }} />
              <h3 className="font-serif text-lg mt-4 text-[color:var(--espresso)]">{m.name}</h3>
              <span className="label-caps text-[10px] text-[color:var(--gold-dark)] mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight className="w-3 h-3" /></span>
            </Link>
          ))}
        </div>
      </section>

      <OrnamentalDivider />

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">Signature Edits</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">Featured Categories</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-4">
          {FEATURED.map((f) => (
            <Link key={f.name} to="/gold" className={`relative rounded-2xl overflow-hidden group ${f.span}`}>
              <img src={f.img} alt={f.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-serif text-white text-2xl md:text-3xl">{f.name}</h3>
                <p className="text-white/70 text-xs mt-1">{f.tag}</p>
                <span className="pill-gold text-xs mt-3 !py-1.5 !px-3 inline-flex">Shop Now <ArrowRight className="w-3 h-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <OrnamentalDivider />

      {/* Trending in Gold */}
      <section className="max-w-7xl mx-auto px-4">
        <div style={{ backgroundColor: "var(--panel)" }} className="rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <p className="label-caps text-[color:var(--gold-dark)] text-xs">Curated Favourites</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">Trending in Gold</h2>
            <p className="text-[color:var(--muted-foreground)] mt-2">Handpicked bestsellers this season</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {["Rings","Necklaces","Earrings","Bangles","Chains"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  tab === t ? "bg-[color:var(--gold)] text-white" : "bg-white border border-[color:var(--border)] text-[color:var(--espresso)] hover:border-[color:var(--gold)]"
                }`}
              >{t}</button>
            ))}
          </div>
          {loading ? (
            <div className="text-center py-10 text-[color:var(--muted-foreground)]">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {(trending.length ? trending : goldProducts.slice(0, 4)).map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
              {goldProducts.length === 0 && (
                <p className="col-span-full text-center text-[color:var(--muted-foreground)] py-6">No products yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      <OrnamentalDivider />

      {/* Explore Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="label-caps text-[color:var(--gold-dark)] text-xs">Discover</p>
            <h2 className="font-serif text-4xl mt-2 text-[color:var(--espresso)]">Explore Our Categories</h2>
            <p className="text-[color:var(--muted-foreground)] mt-1">Browse across metals and styles</p>
          </div>
          <Link to="/gold" className="pill-gold-outline">View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {explore.map((p) => <ProductCard key={p.id} p={p} />)}
            {explore.length === 0 && (
              <p className="col-span-full text-center text-[color:var(--muted-foreground)] py-6">No products yet.</p>
            )}
          </div>
        )}
      </section>

      {/* Shop by Type */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="text-center mb-8">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">Quick Shop</p>
          <h2 className="font-serif text-4xl mt-2 text-[color:var(--espresso)]">Shop by Type</h2>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 justify-start md:justify-center">
          {QUICK_TYPES.map((t, i) => {
            const img = [catRings, catChains, catEarrings, catBangles, catNecklaces, catPendants, catChains, catMangalsutra][i];
            return (
              <Link key={t} to="/gold" className="text-center shrink-0 group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[color:var(--gold)]/50 overflow-hidden group-hover:border-[color:var(--gold)] transition">
                  <img src={img} alt={t} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="mt-2 text-xs font-medium text-[color:var(--espresso)]">{t}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <OrnamentalDivider />

      {/* Bridal Collection Picks */}
      {!loading && bridalPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label-caps text-[color:var(--gold-dark)] text-xs">NVS Picks</p>
              <h2 className="font-serif text-4xl mt-2 text-[color:var(--espresso)]">Bridal Collection Picks</h2>
              <p className="text-[color:var(--muted-foreground)] mt-1">For your most sacred day</p>
            </div>
            <Link to="/gold" className="text-[color:var(--gold-dark)] font-semibold text-sm inline-flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {bridalPicks.map((p) => <SimpleProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </Layout>
  );
}

function LiveRatesBar() {
  const [rates, setRates] = useState<{ gold: Record<string, number>; silver: Record<string, number> } | null>(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    fetch(`${API_URL}/rates`)
      .then((res) => res.json())
      .then((data) => setRates(data.rates ?? null))
      .catch(() => setRates(null));
  }, []);

  return (
    <div style={{ backgroundColor: "var(--cream)" }} className="border-y border-[color:var(--gold)]/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label-caps text-[color:var(--gold-dark)] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />Today's Rates
          </span>
          {rates ? (
            [
              ["Gold 22K", rates.gold["22K"]],
              ["Gold 24K", rates.gold["24K"]],
              ["Gold 18K", rates.gold["18K"]],
              ["Silver", rates.silver["92.5"]],
            ].map(([l, v]) => (
              <span key={l as string} className="bg-white/70 border border-[color:var(--gold)]/30 rounded-full px-3 py-1 text-xs font-medium">
                <span className="text-[color:var(--espresso)]">{l}</span>
                <span className="text-[color:var(--gold-dark)] ml-2 font-bold">₹{v}/g</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-[color:var(--muted-foreground)]">Loading rates...</span>
          )}
        </div>
        <Link 
  to={"/LiveRates" as any} 
  className="flex items-center gap-1.5 text-[color:var(--gold-dark)] font-semibold text-xs hover:underline transition-all"
>
  <RefreshCw className="w-3.5 h-3.5" /> View details
</Link>
      </div>
    </div>
  );
}