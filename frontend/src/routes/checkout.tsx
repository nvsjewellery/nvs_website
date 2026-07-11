import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { getProduct } from "@/lib/products";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const cart = useStore((s) => s.cart);
  const nav = useNavigate();
  const [pay, setPay] = useState<"UPI" | "Card" | "Netbanking">("UPI");
  const items = cart.map((c) => ({ ...c, p: getProduct(c.productId)! })).filter((c) => c.p);
  const total = items.reduce((s, i) => s + computeBreakdown(i.p.weight, i.p.purity).total * i.qty, 0);

  function place(e: React.FormEvent) {
    e.preventDefault();
    actions.clearCart();
    alert("Order placed! (mock demo)");
    nav({ to: "/account" });
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">Checkout</h1>
        <OrnamentalDivider />
        <form onSubmit={place} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">Shipping Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full name" required />
                <Input label="Phone" required />
                <Input label="Email" required type="email" full />
                <Input label="Address" required full />
                <Input label="City" required />
                <Input label="State" required />
                <Input label="PIN Code" required />
              </div>
            </div>

            <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6">
              <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">Payment Method (Razorpay)</h3>
              <div className="grid grid-cols-3 gap-2">
                {(["UPI","Card","Netbanking"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPay(m)}
                    className={`py-3 rounded-xl border text-sm font-medium transition ${
                      pay === m ? "border-[color:var(--gold)] bg-[color:var(--cream)] text-[color:var(--gold-dark)]" : "border-[color:var(--border)] hover:border-[color:var(--gold)]"
                    }`}
                  >{m}</button>
                ))}
              </div>
              <p className="text-xs text-[color:var(--gold-dark)] mt-4">
                Payment gateway integration is mocked in this demo — no real payment is processed.
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--panel)" }} className="rounded-2xl p-6 h-fit">
            <h3 className="font-serif text-xl text-[color:var(--espresso)] mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map((i) => {
                const bd = computeBreakdown(i.p.weight, i.p.purity);
                return (
                  <div key={i.productId} className="flex justify-between text-[color:var(--espresso)]">
                    <span className="min-w-0 truncate pr-2">{i.p.name} × {i.qty}</span>
                    <span className="shrink-0">{formatINR(bd.total * i.qty)}</span>
                  </div>
                );
              })}
              {items.length === 0 && <p className="text-[color:var(--muted-foreground)]">Cart is empty.</p>}
            </div>
            <div className="h-px bg-[color:var(--gold)]/30 my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            <button type="submit" className="pill-gold w-full justify-center mt-5 flex">Place Order</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Input({ label, full, ...rest }: { label: string; full?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs label-caps text-[color:var(--gold-dark)]">{label}</span>
      <input {...rest} className="mt-1 w-full border border-[color:var(--border)] rounded-lg px-3 py-2.5 text-sm bg-white focus:border-[color:var(--gold)] outline-none" />
    </label>
  );
}
