import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { formatINR } from "@/lib/store";

export const Route = createFileRoute("/liverates")({
  component: LiveRatesPage,
});

interface LiveRateCard {
  label: string;
  purity: string;
  rate: number;
  desc: string;
}

interface LiveRatesResponse {
  success?: boolean;
  gold24?: string | number;
  gold22?: string | number;
  gold18?: string | number;
  silver?: string | number;
  source?: string;
  updatedAt?: string;
  rates?: {
    gold?: Record<string, number>;
    silver?: Record<string, number>;
    source?: string;
    updatedAt?: string;
  };
}

export function LiveRatesPage() {
  const [loading, setLoading] = useState(true);

  const [updatedAt, setUpdatedAt] = useState("");

  const [source, setSource] = useState("");

  const [goldRates, setGoldRates] = useState<LiveRateCard[]>([]);

  const [silverRates, setSilverRates] = useState<LiveRateCard[]>([]);

  const fetchRates = async () => {
    try {
      setLoading(true);

      const res = await fetch("https://suvarnagold-16e5.vercel.app/api/rates");

      const data: LiveRatesResponse = await res.json();

      const parseVal = (v: any) =>
        typeof v === "number"
          ? v
          : Number(String(v ?? 0).replace(/[₹,]/g, ""));

      const g24 =
        data.rates?.gold?.["24K"] ??
        parseVal(data.gold24);

      const g22 =
        data.rates?.gold?.["22K"] ??
        parseVal(data.gold22);

      const g18 =
        data.rates?.gold?.["18K"] ??
        parseVal(data.gold18);

      const g14 =
        data.rates?.gold?.["14K"] ??
        Math.round(g24 * (14 / 24));

      const g9 =
        data.rates?.gold?.["9K"] ??
        Math.round(g24 * (9 / 24));

      const silverBase =
        data.rates?.silver?.["99"]
          ? Math.round(data.rates.silver["99"] / 0.99)
          : parseVal(data.silver);

      const s99 = Math.round(silverBase * 0.99);

      const s835 = Math.round(silverBase * 0.835);

      const s80 = Math.round(silverBase * 0.80);

      const s75 = Math.round(silverBase * 0.75);

      setGoldRates([
        {
          label: "24K Gold",
          purity: "99.9% Pure Gold",
          rate: g24,
          desc: "Bullion & Gold Coins",
        },
        {
          label: "22K Gold",
          purity: "91.6% BIS Hallmarked",
          rate: g22,
          desc: "Traditional Jewellery",
        },
        {
          label: "18K Gold",
          purity: "75.0% Hallmarked",
          rate: g18,
          desc: "Diamond & Modern Gold",
        },
        {
          label: "14K Gold",
          purity: "58.3% Pure Gold",
          rate: g14,
          desc: "Lightweight Jewellery",
        },
        {
          label: "9K Gold",
          purity: "37.5% Pure Gold",
          rate: g9,
          desc: "Budget / Daily Wear",
        },
      ]);

      setSilverRates([
        {
          label: "990 Fine Silver (99%)",
          purity: "99.0% Pure Silver",
          rate: s99,
          desc: "Silver Coins & Fine Bullion",
        },
        {
          label: "83.5 Silver",
          purity: "83.5% Fine",
          rate: s835,
          desc: "Articles & Utensils",
        },
        {
          label: "800 Silver (80%)",
          purity: "80.0% Purity",
          rate: s80,
          desc: "Payal & Traditional Wear",
        },
        {
          label: "750 Silver (75%)",
          purity: "75.0% Purity",
          rate: s75,
          desc: "Ornaments & Crafts",
        },
      ]);

      setSource(data.source || data.rates?.source || "");

      const updated = data.updatedAt || data.rates?.updatedAt;

      if (updated) {
        setUpdatedAt(
          new Date(updated).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);
  return (
  <Layout>
    <section
      style={{ backgroundColor: "var(--cream)" }}
      className="border-b border-[color:var(--gold)]/20 py-10 md:py-14"
    >
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="label-caps text-[color:var(--gold-dark)] text-xs font-semibold tracking-widest uppercase">
          Certified Purity & Pricing
        </p>

        <h1 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">
          Live Bullion Metal Rates
        </h1>

        <p className="text-[color:var(--muted-foreground)] mt-3 max-w-xl mx-auto text-sm">
          Real-time market rates per gram. All store prices update dynamically
          against these benchmarks.
        </p>
      </div>
    </section>

    <OrnamentalDivider />

    <section className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      <div className="flex flex-col sm:flex-row items-center justify-between bg-[color:var(--panel)] border border-[color:var(--border)] rounded-xl px-6 py-4 gap-3">

        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          <span className="text-sm text-[color:var(--espresso)]">
            Last Refreshed :
            <strong className="ml-1">{updatedAt || "Just now"}</strong>

            {source && (
              <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">
                ({source})
              </span>
            )}
          </span>
        </div>

        <button
          onClick={fetchRates}
          disabled={loading}
          className="bg-[color:var(--espresso)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[color:var(--gold-dark)] transition disabled:opacity-50"
        >
          {loading ? "Updating..." : "Refresh Feed"}
        </button>

      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">

        {/* GOLD */}

        <div className="bg-white border border-[color:var(--border)] rounded-3xl p-8 shadow-sm flex flex-col">

          <div className="flex justify-between items-center border-b border-[color:var(--border)] pb-5 mb-6">

            <div>
              <p className="uppercase tracking-[3px] text-xs text-[color:var(--gold-dark)] font-semibold">
                Gold Rates
              </p>

              <h2 className="font-serif text-5xl text-[color:var(--espresso)]">
                Yellow Metal
              </h2>
            </div>

            <span className="text-4xl">👑</span>

          </div>

          <div className="space-y-4 flex-1">

            {goldRates.map((item) => (

              <div
                key={item.label}
                className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-6 py-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-serif text-2xl text-[color:var(--espresso)]">
                    {item.label}
                  </h3>

                  <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                    {item.purity} · {item.desc}
                  </p>

                </div>

                <div className="text-right">

                  <div className="text-2xl font-bold text-[color:var(--espresso)]">
                    {formatINR(item.rate)}
                  </div>

                  <div className="text-sm text-[color:var(--muted-foreground)]">
                    / gram
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* SILVER */}

        <div className="bg-white border border-[color:var(--border)] rounded-3xl p-8 shadow-sm flex flex-col">

          <div className="flex justify-between items-center border-b border-[color:var(--border)] pb-5 mb-6">

            <div>

              <p className="uppercase tracking-[3px] text-xs text-[color:var(--muted-foreground)] font-semibold">
                Silver Rates
              </p>

              <h2 className="font-serif text-5xl text-[color:var(--espresso)]">
                White Metal
              </h2>

            </div>

            <span className="text-4xl">✨</span>

          </div>

          {/* IMPORTANT */}

          <div className="flex flex-col flex-1 gap-4">

            {silverRates.map((item) => (

              <div
                key={item.label}
                className="flex-1 rounded-3xl border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-6 py-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-serif text-2xl text-[color:var(--espresso)]">
                    {item.label}
                  </h3>

                  <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                    {item.purity} · {item.desc}
                  </p>

                </div>

                <div className="text-right">

                  <div className="text-2xl font-bold text-[color:var(--espresso)]">
                    {formatINR(item.rate)}
                  </div>

                  <div className="text-sm text-[color:var(--muted-foreground)]">
                    / gram
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      <div className="border-t border-[color:var(--border)] pt-6 text-center text-xs text-[color:var(--muted-foreground)]">

        Prices shown are raw bullion rates per gram. Final jewellery prices may
        include making charges, wastage and GST.

      </div>

    </section>

  </Layout>
);
}