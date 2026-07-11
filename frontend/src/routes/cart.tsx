import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { getProduct } from "@/lib/products";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const cart = useStore((s) => s.cart);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);

  const items = cart.map((c) => ({ ...c, p: getProduct(c.productId)! })).filter((c) => c.p);
  const subtotal = items.reduce((s, i) => s + computeBreakdown(i.p.weight, i.p.purity).total * i.qty, 0);
  const discount = applied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">Your Cart</h1>
        <OrnamentalDivider />

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[color:var(--muted-foreground)]">Your cart is empty.</p>
            <Link to="/gold" className="pill-gold mt-6 inline-flex">Browse Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              {items.map((i) => {
                const bd = computeBreakdown(i.p.weight, i.p.purity);
                return (
                  <div key={i.productId} className="bg-white border border-[color:var(--border)] rounded-2xl p-4 flex gap-4">
                    <img src={i.p.image} alt={i.p.name} className="w-24 h-24 rounded-lg object-cover bg-[color:var(--panel)] shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-serif font-bold text-[color:var(--espresso)]">{i.p.name}</h3>
                          <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{i.p.purity} · {i.p.weight}g</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-serif font-bold text-[color:var(--gold-dark)]">{formatINR(bd.total * i.qty)}</div>
                          <div className="text-[10px] text-[color:var(--muted-foreground)]">incl. GST</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center border border-[color:var(--border)] rounded-full">
                          <button onClick={() => actions.updateQty(i.productId, i.qty - 1)} className="p-2"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                          <button onClick={() => actions.updateQty(i.productId, i.qty + 1)} className="p-2"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <button onClick={() => actions.removeFromCart(i.productId)} className="text-destructive text-xs font-medium inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ backgroundColor: "var(--panel)" }} className="rounded-2xl p-6 h-fit">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">Order Summary</h3>
              <Row l="Subtotal" v={formatINR(subtotal)} />
              <Row l="Shipping" v={<span className="text-green-700 font-semibold">Free</span>} />
              {applied && <Row l="Coupon (NVS10)" v={<span className="text-green-700">-{formatINR(discount)}</span>} />}

              <div className="flex gap-2 mt-4">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon (try NVS10)" className="flex-1 border border-[color:var(--border)] rounded-full px-4 py-2 text-sm bg-white" />
                <button onClick={() => setApplied(coupon.trim().toUpperCase() === "NVS10")} className="pill-gold-outline !py-2 !px-4 text-xs">Apply</button>
              </div>

              <div className="h-px bg-[color:var(--gold)]/30 my-4" />
              <div className="flex justify-between font-bold text-lg text-[color:var(--espresso)]">
                <span>Total</span><span>{formatINR(total)}</span>
              </div>
              <Link to="/checkout" className="pill-gold w-full justify-center mt-5 flex">Proceed to Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return <div className="flex justify-between text-sm py-1.5 text-[color:var(--espresso)]"><span>{l}</span><span>{v}</span></div>;
}
