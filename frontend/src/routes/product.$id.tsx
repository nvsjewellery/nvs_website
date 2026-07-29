import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { metalSlug } from "@/lib/products";
import { productsApi } from "@/lib/api";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  loader: async ({ params }) => {
    try {
      const p = await productsApi.getById(params.id);
      if (!p) throw notFound();
      return p;
    } catch {
      throw notFound();
    }
  },
});

function ProductPage() {
  const p = Route.useLoaderData() as any;
  const [qty, setQty] = useState(1);
  const wishlist = useStore((s) => s.wishlist);
  const saved = wishlist.includes(p?.id);

  const weightVal = Number(p?.weight ?? p?.grossWeight ?? 0);
  const bd = computeBreakdown(weightVal, p?.purity || "22K");

  // Extract description string safely
  const rawDesc = String(p?.description || p?.desc || p?.details || "").trim();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 text-xs label-caps text-[color:var(--gold-dark)]">
        <Link to="/">Home</Link> <span className="mx-1">/</span>
        <Link to={`/${metalSlug(p.metal)}` as string}>{p.metal}</Link> <span className="mx-1">/</span>
        <span className="text-[color:var(--espresso)]">{p.name}</span>
      </div>

      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--border)]">
            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square bg-[color:var(--panel)] rounded-lg overflow-hidden border border-[color:var(--border)] hover:border-[color:var(--gold)] cursor-pointer"
              >
                <img src={p.image} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="label-caps text-[color:var(--gold-dark)] text-xs">
            {p.metal} · {p.sub || p.category}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mt-2 text-[color:var(--espresso)]">{p.name}</h1>
          <div className="flex items-center gap-3 mt-4">
            <span className="pill-gold-outline !py-1 !px-3 text-xs">{p.purity}</span>
            <span className="text-sm text-[color:var(--muted-foreground)]">{weightVal} g</span>
          </div>
          <div className="mt-6">
            <div className="text-4xl font-serif text-[color:var(--gold-dark)] font-bold">{formatINR(p.price)}</div>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Inclusive of GST · Includes making charges</p>
          </div>

          <div style={{ backgroundColor: "var(--panel)" }} className="rounded-2xl p-5 mt-6">
            <p className="label-caps text-[color:var(--gold-dark)] text-[10px] mb-3">Live Price Breakdown</p>
            <BreakdownRow l={`Metal value (${weightVal}g @ ${p.purity})`} v={bd.metalValue} />
            <BreakdownRow l={`Making charges (${bd.makingPct}%)`} v={bd.making} />
            <BreakdownRow l={`GST (${bd.gstPct}%)`} v={bd.gst} />
            <div className="h-px bg-[color:var(--gold)]/30 my-3" />
            <BreakdownRow l="Total" v={bd.total} bold />
          </div>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <div className="flex items-center border border-[color:var(--border)] rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2.5">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => actions.addToCart(p.id, qty)} className="pill-gold">
              Add to Cart
            </button>
            <Link to="/checkout" onClick={() => actions.addToCart(p.id, qty)} className="pill-gold-outline">
              Buy Now
            </Link>
            <button
              onClick={() => actions.toggleWishlist(p.id)}
              className="w-11 h-11 rounded-full border border-[color:var(--gold)] grid place-items-center"
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-[color:var(--gold-dark)]"}`} />
            </button>
          </div>

          {/* Dynamic Description Section */}
          <div className="mt-8 pt-6 border-t border-[color:var(--border)]">
            <p className="text-sm text-[color:var(--muted-foreground)] leading-relaxed whitespace-pre-line">
              {rawDesc.length > 0
                ? rawDesc
                : `${p.name} — crafted in ${p.purity} ${p.metal?.toLowerCase()} weighing ${weightVal}g. Traditional hand-finishing with heritage techniques.`}
            </p>
          </div>
        </div>
      </section>

      <OrnamentalDivider className="mt-16" />
    </Layout>
  );
}

function BreakdownRow({ l, v, bold }: { l: string; v: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm py-1 ${bold ? "font-bold text-[color:var(--espresso)] text-base" : "text-[color:var(--muted-foreground)]"}`}>
      <span>{l}</span>
      <span>{formatINR(v)}</span>
    </div>
  );
}