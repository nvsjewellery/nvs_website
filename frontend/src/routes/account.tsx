import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Box, Heart, MapPin, Tag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { actions, formatINR, useStore } from "@/lib/store";
import { getProduct } from "@/lib/products";

export const Route = createFileRoute("/account")({ component: Account });

function Account() {
  const user = useStore((s) => s.user);
  const wishlist = useStore((s) => s.wishlist);
  const nav = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl">Please sign in</h1>
          <Link to="/signin" className="pill-gold mt-6 inline-flex">Sign In</Link>
        </div>
      </Layout>
    );
  }

  const orders = [
    { id: "NVS-102847", date: "12 Jun 2026", items: 2, price: 432320 },
    { id: "NVS-102611", date: "24 May 2026", items: 1, price: 145820 },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">Hi, {user.name}</h1>
            <p className="text-[color:var(--gold-dark)] mt-2">{user.email}</p>
          </div>
          <button onClick={() => { actions.signOut(); nav({ to: "/" }); }} className="pill-gold-outline">Sign Out</button>
        </div>
        <OrnamentalDivider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card icon={<Box className="w-4 h-4" />} title="My Orders">
            <ul className="divide-y divide-[color:var(--border)]">
              {orders.map((o) => (
                <li key={o.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-semibold text-[color:var(--espresso)]">{o.id}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)]">{o.date} · {o.items} items</div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif font-bold text-[color:var(--gold-dark)]">{formatINR(o.price)}</div>
                    <button className="text-xs text-[color:var(--gold-dark)] font-medium">Track →</button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card icon={<Heart className="w-4 h-4" />} title="Wishlist">
            {wishlist.length === 0 ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">No saved items yet.</p>
            ) : (
              <ul className="space-y-2">
                {wishlist.slice(0, 3).map((id) => {
                  const p = getProduct(id);
                  if (!p) return null;
                  return <li key={id} className="text-sm">{p.name} — <span className="text-[color:var(--gold-dark)]">{formatINR(p.price)}</span></li>;
                })}
              </ul>
            )}
            <Link to="/wishlist" className="text-xs text-[color:var(--gold-dark)] font-semibold mt-3 inline-block">View all →</Link>
          </Card>

          <Card icon={<MapPin className="w-4 h-4" />} title="Saved Addresses">
            <div className="space-y-3 text-sm">
              <div>
                <div className="label-caps text-[10px] text-[color:var(--gold-dark)]">Home</div>
                <div className="text-[color:var(--espresso)]">12, Green Park, New Delhi — 110016</div>
              </div>
              <div>
                <div className="label-caps text-[10px] text-[color:var(--gold-dark)]">Work</div>
                <div className="text-[color:var(--espresso)]">Level 4, Cyber Hub, Gurugram — 122002</div>
              </div>
            </div>
          </Card>

          <Card icon={<Tag className="w-4 h-4" />} title="Coupons">
            <ul className="space-y-3 text-sm">
              <li><span className="font-bold text-[color:var(--gold-dark)]">NVS10</span> — 10% off your next order</li>
              <li><span className="font-bold text-[color:var(--gold-dark)]">BRIDAL25</span> — 25% off bridal collection</li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-[color:var(--panel)] grid place-items-center text-[color:var(--gold-dark)]">{icon}</span>
        <h3 className="font-serif text-xl text-[color:var(--espresso)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
