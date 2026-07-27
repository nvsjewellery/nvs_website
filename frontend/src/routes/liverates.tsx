import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { formatINR } from "@/lib/store";

// 1. ADD THIS ROUTE EXPORT:
export const Route = createFileRoute("/liverates")({
  component: LiveRatesPage,
});

interface LiveRatesResponse {
  success?: boolean;
  rates?: {
    gold?: Record<string, number>;
    silver?: Record<string, number>;
    source?: string;
    updatedAt?: string;
  };
}

export function LiveRatesPage() {
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [source, setSource] = useState<string>("");

  // Rates State (per gram in ₹)
  const [goldRates, setGoldRates] = useState<{ label: string; purity: string; rate: number; desc: string }[]>([]);
  const [silverRates, setSilverRates] = useState<{ label: string; purity: string; rate: number; desc: string }[]>([]);

  const fetchRates = () => {
    setLoading(true);
    fetch("https://suvarnagold-16e5.vercel.app/api/rates")
      .then((res) => res.json())
      .then((data: LiveRatesResponse) => {
        if (data.rates) {
          const g = data.rates.gold || {};
          const s = data.rates.silver || {};

          // Extract base values
          const g24 = g["24K"] ?? 14493;
          const g22 = g["22K"] ?? Math.round(g24 * (22 / 24));
          const g18 = g["18K"] ?? Math.round(g24 * (18 / 24));
          const g14 = g["14K"] ?? Math.round(g24 * (14 / 24));
          const g9 = g["9K"] ?? Math.round(g24 * (9 / 24));

          const s925 = s["92.5"] ?? 222;
          const s835 = s["83.5"] ?? Math.round(s925 * (83.5 / 92.5));
          const s80 = s["80"] ?? Math.round(s925 * (80 / 92.5));
          const s75 = s["75"] ?? Math.round(s925 * (75 / 92.5));

          setGoldRates([
            { label: "24K Gold", purity: "99.9% Pure Gold", rate: g24, desc: "Bullion & Gold Coins" },
            { label: "22K Gold", purity: "91.6% BIS Hallmarked", rate: g22, desc: "Traditional Jewellery" },
            { label: "18K Gold", purity: "75.0% Hallmarked", rate: g18, desc: "Diamond & Modern Gold" },
            { label: "14K Gold", purity: "58.3% Pure Gold", rate: g14, desc: "Lightweight Jewellery" },
            { label: "9K Gold", purity: "37.5% Pure Gold", rate: g9, desc: "Budget / Daily Wear" },
          ]);

          setSilverRates([
            { label: "925 Sterling Silver", purity: "92.5% Hallmarked", rate: s925, desc: "Silver Fine Jewellery" },
            { label: "83.5 Silver", purity: "83.5% Fine", rate: s835, desc: "Articles & Utensils" },
            { label: "800 Silver (80%)", purity: "80.0% Purity", rate: s80, desc: "Payal & Traditional Wear" },
            { label: "750 Silver (75%)", purity: "75.0% Purity", rate: s75, desc: "Ornaments & Crafts" },
          ]);

          if (data.rates.source) setSource(data.rates.source);
          if (data.rates.updatedAt) {
            setUpdatedAt(new Date(data.rates.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      })
      .catch((err) => console.error("Error fetching live rates:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return (
    <Layout>
      {/* Header Banner */}
      <section style={{ backgroundColor: "var(--cream)" }} className="border-b border-[color:var(--gold)]/20 py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs font-semibold tracking-widest uppercase">
            Certified Purity & Pricing
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">
            Live Bullion Metal Rates
          </h1>
          <p className="text-[color:var(--muted-foreground)] mt-3 max-w-xl mx-auto text-sm">
            Real-time market rates per gram. All store prices update dynamically against these benchmarks.
          </p>
        </div>
      </section>

      <OrnamentalDivider />

      <section className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Status & Refresh Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-[color:var(--panel)] border border-[color:var(--border)] px-6 py-4 rounded-xl text-sm gap-3">
          <div className="flex items-center gap-2.5 text-[color:var(--espresso)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Last Refreshed: <strong className="font-semibold">{updatedAt || "Just now"}</strong>
              {source && <span className="text-xs text-[color:var(--muted-foreground)] ml-2">({source})</span>}
            </span>
          </div>

          <button
            onClick={fetchRates}
            disabled={loading}
            className="text-xs font-semibold uppercase tracking-wider bg-[color:var(--espresso)] text-white hover:bg-[color:var(--gold-dark)] transition-colors px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Updating..." : "Refresh Feed"}
          </button>
        </div>

        {/* Rates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Gold Section */}
          <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[color:var(--gold-dark)] font-semibold">
                  Gold Rates
                </span>
                <h2 className="text-2xl font-serif text-[color:var(--espresso)]">Yellow Metal</h2>
              </div>
              <span className="text-2xl">👑</span>
            </div>

            <div className="space-y-3">
              {goldRates.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl bg-[color:var(--cream)]/50 border border-[color:var(--border)]">
                  <div>
                    <h3 className="font-serif font-semibold text-[color:var(--espresso)]">{item.label}</h3>
                    <p className="text-xs text-[color:var(--muted-foreground)]">{item.purity} · {item.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[color:var(--espresso)]">{formatINR(item.rate)}</span>
                    <span className="text-xs text-[color:var(--muted-foreground)] block">/ gram</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Silver Section */}
          <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)] font-semibold">
                  Silver Rates
                </span>
                <h2 className="text-2xl font-serif text-[color:var(--espresso)]">White Metal</h2>
              </div>
              <span className="text-2xl">✨</span>
            </div>

            <div className="space-y-3">
              {silverRates.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl bg-[color:var(--cream)]/50 border border-[color:var(--border)]">
                  <div>
                    <h3 className="font-serif font-semibold text-[color:var(--espresso)]">{item.label}</h3>
                    <p className="text-xs text-[color:var(--muted-foreground)]">{item.purity} · {item.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-[color:var(--espresso)]">{formatINR(item.rate)}</span>
                    <span className="text-xs text-[color:var(--muted-foreground)] block">/ gram</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Informational Footer Note */}
        <div className="text-center text-xs text-[color:var(--muted-foreground)] border-t border-[color:var(--border)] pt-6 space-y-1">
          <p>* Prices shown are raw metal values per gram. Product prices on the website include applicable making charges and GST.</p>
        </div>
      </section>
    </Layout>
  );
}