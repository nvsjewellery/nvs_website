import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ProductCard, SimpleProductCard } from "@/components/ProductCard";
import { metalSlug } from "@/lib/products";
import { productsApi } from "@/lib/api";
import { type Product } from "@/lib/store";

// Static asset imports
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catBangles from "@/assets/cat-bangles.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catMangalsutra from "@/assets/cat-mangalsutra.jpg";
import catChains from "@/assets/cat-chains.jpg";

export const Route = createFileRoute("/")({ component: Home });

const HERO_SLIDES = [
  {
    title: "Everyday Gold,",
    highlight: "Timeless Sparkle",
    subtitle: "Certified craftsmanship since 1978. Discover heirloom pieces crafted for modern elegance.",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1920&auto=format&fit=crop",
    linkText: "Shop Gold Collection",
    linkUrl: "/gold",
  },
  {
    title: "Graceful Heritage,",
    highlight: "Royal Bridal Edits",
    subtitle: "Intricately detailed temple and bridal jewellery designed to make your special moments eternal.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1920&auto=format&fit=crop",
    linkText: "Explore Bridal Line",
    linkUrl: "/gold",
  },
  {
    title: "Pure & Radiant,",
    highlight: "Silver Craftsmanship",
    subtitle: "Hallmarked sterling silver and fine bullion articles styled for contemporary everyday luxury.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1920&auto=format&fit=crop",
    linkText: "Discover Silver",
    linkUrl: "/silver",
  },
];

const METALS = [
  { name: "Gold", grad: "linear-gradient(135deg,#f6d47a,#b8912f)" },
  { name: "Silver", grad: "linear-gradient(135deg,#e8e8ea,#a8a8ac)" },
];

const FEATURED = [
  { name: "Necklaces", tag: "Handcrafted heirlooms", img: `${catNecklaces}?v=2` },
  { name: "Bangles", tag: "Stacked in tradition", img: `${catBangles}?v=2` },
  { name: "Rings", tag: "Sparkling promises", img: `${catRings}?v=2` },
  { name: "Earrings", tag: "Jhumkas & drops", img: `${catEarrings}?v=2` },
  { name: "Mangalsutra", tag: "Sacred bonds", img: `${catMangalsutra}?v=2` },
  { name: "Chains", tag: "Everyday classics", img: `${catChains}?v=2` },
];

const DEFAULT_CATEGORIES = ["Rings", "Necklaces", "Earrings", "Bangles", "Chains"];

// Robust helper to extract category across all backend property variants (sub, subCategory, category)
function getProductCategory(p: Product): string {
  const raw = p as unknown as Record<string, unknown>;
  const val = (p.sub || raw.subCategory || raw.category || "") as string;
  return val.trim();
}

function Home() {
  const [goldProducts, setGoldProducts] = useState<Product[]>([]);
  const [silverProducts, setSilverProducts] = useState<Product[]>([]);
  const [loadingGold, setLoadingGold] = useState(true);
  const [loadingSilver, setLoadingSilver] = useState(true);

  const [goldTab, setGoldTab] = useState("");
  const [silverTab, setSilverTab] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Fetch Gold Products
  useEffect(() => {
    let cancelled = false;
    productsApi
      .getByMetal("Gold")
      .then((data) => { if (!cancelled) setGoldProducts(data as Product[]); })
      .catch(() => { if (!cancelled) setGoldProducts([]); })
      .finally(() => { if (!cancelled) setLoadingGold(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch Silver Products
  useEffect(() => {
    let cancelled = false;
    productsApi
      .getByMetal("Silver")
      .then((data) => { if (!cancelled) setSilverProducts(data as Product[]); })
      .catch(() => { if (!cancelled) setSilverProducts([]); })
      .finally(() => { if (!cancelled) setLoadingSilver(false); });
    return () => { cancelled = true; };
  }, []);

  // Dynamically extract unique categories from actual Admin DB products
  const goldCategories = useMemo(() => {
    const categories = Array.from(
      new Set(goldProducts.map(getProductCategory).filter(Boolean))
    );
    return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  }, [goldProducts]);

  const silverCategories = useMemo(() => {
    const categories = Array.from(
      new Set(silverProducts.map(getProductCategory).filter(Boolean))
    );
    return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  }, [silverProducts]);

  // Sync active tabs to first available category when products load
  useEffect(() => {
    if (goldCategories.length > 0 && !goldCategories.some((c) => c.toLowerCase() === goldTab.toLowerCase())) {
      setGoldTab(goldCategories[0]);
    }
  }, [goldCategories]);

  useEffect(() => {
    if (silverCategories.length > 0 && !silverCategories.some((c) => c.toLowerCase() === silverTab.toLowerCase())) {
      setSilverTab(silverCategories[0]);
    }
  }, [silverCategories]);

  // Filter products for dynamic trending tabs
  const goldTrending = goldProducts
    .filter((p) => getProductCategory(p).toLowerCase() === goldTab.toLowerCase())
    .slice(0, 4);

  const silverTrending = silverProducts
    .filter((p) => getProductCategory(p).toLowerCase() === silverTab.toLowerCase())
    .slice(0, 4);

  const explore = goldProducts.slice(0, 8);
  const bridalPicks = goldProducts
    .filter((p) => {
      const cat = getProductCategory(p).toLowerCase();
      return cat === "necklaces" || cat === "mangalsutra";
    })
    .slice(0, 5);

  return (
    <Layout>
      {/* Hero Carousel Banner */}
      <section className="relative h-[75vh] min-h-[480px] max-h-[680px] overflow-hidden bg-black">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[4500ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent max-w-3xl" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="max-w-xl space-y-4">
                <p className="label-caps text-[color:var(--gold)] text-xs tracking-widest font-semibold uppercase">
                  NVS Jewellery Presents
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-white">
                  {slide.title}<br />
                  <span className="text-[color:var(--gold)] italic font-serif">
                    {slide.highlight}
                  </span>
                </h1>
                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-md">
                  {slide.subtitle}
                </p>
                <div className="pt-2">
                  <Link to={slide.linkUrl} className="pill-gold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition">
                    {slide.linkText} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-[color:var(--gold)]" : "w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      <LiveRatesBar />

      <OrnamentalDivider />

      {/* 1. Shop by Metal (Light / Base BG) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">Choose Your Metal</p>
          <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--espresso)]">Shop by Metal</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
          {METALS.map((m) => (
            <Link key={m.name} to={`/${metalSlug(m.name)}` as string} className="bg-white border border-[color:var(--border)] rounded-2xl p-6 text-center hover:border-[color:var(--gold)] hover:shadow-md transition group">
              <div className="w-20 h-20 mx-auto rounded-full shadow-inner" style={{ background: m.grad }} />
              <h3 className="font-serif text-lg mt-4 text-[color:var(--espresso)]">{m.name}</h3>
              <span className="label-caps text-[10px] text-[color:var(--gold-dark)] mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight className="w-3 h-3" /></span>
            </Link>
          ))}
        </div>
      </section>

      <OrnamentalDivider />

      {/* 2. Featured Categories Grid (Light Panel BG) */}
      <section className="max-w-7xl mx-auto px-4">
        <div style={{ backgroundColor: "var(--panel)" }} className="rounded-3xl p-6 md:p-10 border border-[color:var(--border)]">
          <div className="text-center mb-10">
            <p className="label-caps text-[color:var(--gold-dark)] text-xs">Signature Edits</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--espresso)]">Featured Categories</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
            {FEATURED.map((f) => (
              <Link 
                key={f.name} 
                to="/gold" 
                search={{ cat: f.name }}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-900 border border-[color:var(--border)] shadow-sm hover:shadow-md transition-all duration-300"
              >
                <img 
                  src={f.img} 
                  alt={f.name} 
                  loading="lazy" 
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-left flex flex-col justify-end">
                  <h3 className="font-serif text-white text-xl md:text-2xl font-normal leading-snug">{f.name}</h3>
                  <p className="text-white/75 text-xs mt-0.5 line-clamp-1">{f.tag}</p>
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--gold)] group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                      Shop Collection <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <OrnamentalDivider />

      {/* 3. Trending in Gold (DARK ESPRESSO BG - Matched with Brand Theme) */}
      <section className="max-w-7xl mx-auto px-4">
        <div style={{ backgroundColor: "var(--espresso)" }} className="rounded-3xl p-6 md:p-10 border border-[color:var(--gold)]/20 text-white shadow-xl">
          <div className="text-center mb-8">
            <p className="label-caps text-[color:var(--gold)] text-xs uppercase tracking-widest font-semibold">Curated Favourites</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--cream)]">Trending in Gold</h2>
            <p className="text-[color:var(--cream)]/70 text-xs mt-1">Handpicked gold bestsellers this season</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {goldCategories.map((t) => (
              <button
                key={t}
                onClick={() => setGoldTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  goldTab.toLowerCase() === t.toLowerCase() 
                    ? "bg-[color:var(--gold)] text-[color:var(--espresso)] font-semibold shadow-md" 
                    : "bg-white/10 border border-white/15 text-white/80 hover:border-[color:var(--gold)] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loadingGold ? (
            <div className="text-center py-10 text-xs text-white/60">Loading products...</div>
          ) : goldTrending.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {goldTrending.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto p-4">
              <p className="text-[color:var(--cream)] font-serif text-base">Products will be available soon!</p>
              <p className="text-xs text-white/60 mt-1">We are updating new handcrafted designs for {goldTab}.</p>
            </div>
          )}
        </div>
      </section>

      <OrnamentalDivider />

      {/* 4. Trending in Silver (LIGHT CREAM BG) */}
      <section className="max-w-7xl mx-auto px-4">
        <div style={{ backgroundColor: "var(--panel)" }} className="rounded-3xl p-6 md:p-10 border border-[color:var(--border)]">
          <div className="text-center mb-8">
            <p className="label-caps text-[color:var(--gold-dark)] text-xs">Modern Sterling Classics</p>
            <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--espresso)]">Trending in Silver</h2>
            <p className="text-[color:var(--muted-foreground)] text-xs mt-1">Contemporary sterling silver favourites</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {silverCategories.map((t) => (
              <button
                key={t}
                onClick={() => setSilverTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  silverTab.toLowerCase() === t.toLowerCase() 
                    ? "bg-[color:var(--gold)] text-white shadow-sm font-semibold" 
                    : "bg-white border border-[color:var(--border)] text-[color:var(--espresso)] hover:border-[color:var(--gold)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loadingSilver ? (
            <div className="text-center py-10 text-xs text-[color:var(--muted-foreground)]">Loading products...</div>
          ) : silverTrending.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {silverTrending.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/80 rounded-2xl border border-[color:var(--border)] max-w-md mx-auto p-4">
              <p className="text-[color:var(--espresso)] font-serif text-base">Products will be available soon!</p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">We are currently adding silver products for {silverTab}.</p>
            </div>
          )}
        </div>
      </section>

      <OrnamentalDivider />

      {/* 5. Explore Our Categories (DARK ESPRESSO BG) */}
      <section className="max-w-7xl mx-auto px-4">
        <div style={{ backgroundColor: "var(--espresso)" }} className="rounded-3xl p-6 md:p-10 border border-[color:var(--gold)]/20 text-white">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label-caps text-[color:var(--gold)] text-xs uppercase tracking-widest font-semibold">Discover</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--cream)]">Explore Our Categories</h2>
            </div>
            <Link to="/gold" className="pill-gold text-xs">View All <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {!loadingGold && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {explore.map((p) => <ProductCard key={p.id} p={p} />)}
              {explore.length === 0 && (
                <p className="col-span-full text-center text-xs text-white/60 py-6">Products will be available soon!</p>
              )}
            </div>
          )}
        </div>
      </section>

      <OrnamentalDivider />

      {/* 6. Bridal Picks (Light BG) */}
      {!loadingGold && bridalPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="label-caps text-[color:var(--gold-dark)] text-xs">NVS Picks</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-1 text-[color:var(--espresso)]">Bridal Collection Picks</h2>
            </div>
            <Link to="/gold" className="text-[color:var(--gold-dark)] font-semibold text-xs inline-flex items-center gap-1">View All <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
    const API_URL = import.meta.env.VITE_API_URL || "https://suvarnagold-16e5.vercel.app/api";
    fetch(`${API_URL}/rates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) {
          setRates(data.rates);
        } else if (data.gold24) {
          const parseVal = (v: unknown) => typeof v === "number" ? v : Number(String(v ?? 0).replace(/[₹,]/g, ""));
          const g24 = parseVal(data.gold24) || 14493;
          const g22 = parseVal(data.gold22) || Math.round(g24 * (22 / 24));
          const g18 = parseVal(data.gold18) || Math.round(g24 * (18 / 24));
          const sVal = parseVal(data.silver) || 240;
          setRates({
            gold: { "22K": g22, "24K": g24, "18K": g18 },
            silver: { "92.5": Math.round(sVal * 0.925) }
          });
        }
      })
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
              ["Silver 925", rates.silver["92.5"]],
            ].map(([l, v]) => (
              <span key={l as string} className="bg-white/70 border border-[color:var(--gold)]/30 rounded-full px-3 py-1 text-xs font-medium">
                <span className="text-[color:var(--espresso)]">{l}</span>
                <span className="text-[color:var(--gold-dark)] ml-2 font-bold font-sans">₹{v}/g</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-[color:var(--muted-foreground)]">Loading rates...</span>
          )}
        </div>
        <Link 
          to="/liverates" 
          className="flex items-center gap-1.5 text-[color:var(--gold-dark)] font-semibold text-xs hover:underline transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> View details
        </Link>
      </div>
    </div>
  );
}