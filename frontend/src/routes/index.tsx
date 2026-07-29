import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ProductCard, SimpleProductCard } from "@/components/ProductCard";
import { metalSlug } from "@/lib/products";
import { productsApi } from "@/lib/api";
import { type Product } from "@/lib/store";
import catNecklaces from "@/assets/cat-necklaces.jpg";
import catBangles from "@/assets/cat-bangles.jpg";
import catRings from "@/assets/cat-rings.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catMangalsutra from "@/assets/cat-mangalsutra.jpg";
import catPendants from "@/assets/cat-pendants.jpg";
import catChains from "@/assets/cat-chains.jpg";

export const Route = createFileRoute("/")({ component: Home });

// Carousel Slides Definition (Bright & Professional Model Aesthetic)
const HERO_SLIDES = [
  {
    title: "Everyday Gold,",
    highlight: "Timeless Sparkle",
    subtitle: "Certified craftsmanship since 1978. Discover heirloom pieces crafted for modern elegance.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1920&auto=format&fit=crop",
    linkText: "Shop Gold Collection",
    linkUrl: "/gold",
  },
  {
    title: "Graceful Heritage,",
    highlight: "Royal Bridal Edits",
    subtitle: "Intricately detailed temple and bridal jewellery designed to make your special moments eternal.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1920&auto=format&fit=crop",
    linkText: "Explore Bridal Line",
    linkUrl: "/gold",
  },
  {
    title: "Pure & Radiant,",
    highlight: "Silver Craftsmanship",
    subtitle: "Hallmarked sterling silver and fine bullion articles styled for contemporary everyday luxury.",
    image: "https://images.unsplash.com/photo-1611591475155-4284fa282b8a?q=80&w=1920&auto=format&fit=crop",
    linkText: "Discover Silver",
    linkUrl: "/silver",
  },
];

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

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll hero slides every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
      {/* Dynamic Bright Model Hero Carousel */}
      <section className="relative h-[80vh] min-h-[520px] max-h-[720px] overflow-hidden bg-[color:var(--cream)]">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Model Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[4500ms] ease-out"
            />
            
            {/* Elegant Soft Bright Gradient (Ivory / Soft Gold to transparent) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--cream)]/95 via-[color:var(--cream)]/75 to-transparent md:w-3/4" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="max-w-xl space-y-4">
                <p className="label-caps text-[color:var(--gold-dark)] text-xs tracking-widest font-semibold uppercase">
                  NVS Jewellery Presents
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-[color:var(--espresso)]">
                  {slide.title}<br />
                  <span className="text-[color:var(--gold-dark)] italic font-serif">
                    {slide.highlight}
                  </span>
                </h1>
                <p className="text-[color:var(--espresso)]/80 text-sm md:text-base leading-relaxed max-w-md">
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

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-[color:var(--gold-dark)]" : "w-2 bg-[color:var(--espresso)]/30 hover:bg-[color:var(--espresso)]/60"
              }`}
            />
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-serif text-white text-2xl md:text-3xl">{f.name}</h3>
                <p className="text-white/80 text-xs mt-1">{f.tag}</p>
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
    const API_URL = import.meta.env.VITE_API_URL || "https://suvarnagold-16e5.vercel.app/api";
    fetch(`${API_URL}/rates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) {
          setRates(data.rates);
        } else if (data.gold24) {
          const parseVal = (v: any) => typeof v === "number" ? v : Number(String(v ?? 0).replace(/[₹,]/g, ""));
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