import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Box, Heart, MapPin, Tag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";
import { productsApi } from "@/lib/api";

export const Route = createFileRoute("/account")({ component: Account });

type WishlistPreviewItem = { id: string; name: string; price: number };

export function Account() {
  const user = useStore((s) => s.user);
  const wishlist = useStore((s) => s.wishlist);
  const nav = useNavigate();
  const [previewItems, setPreviewItems] = useState<WishlistPreviewItem[]>([]);

  const wishlistKeys = wishlist.join(",");

  useEffect(() => {
    if (wishlist.length === 0) {
      setPreviewItems([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      wishlist.slice(0, 3).map((id) =>
        productsApi.getById(id).catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) {
        const items = results
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p: any) => {
            const weightVal = Number(p.weight ?? p.grossWeight ?? 0);
            const bd = computeBreakdown(weightVal, p.purity || "22K");
            const price = bd?.total ? bd.total : Number(p.price || 0);
            return { id: p.id, name: p.name, price };
          });
        setPreviewItems(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wishlistKeys]);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl">Please sign in</h1>
          <Link to="/signin" className="pill-gold mt-6 inline-flex">
            Sign In
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
              Hi, {user.name}
            </h1>
            <p className="text-[color:var(--gold-dark)] mt-2">{user.email}</p>
          </div>
          <button
            onClick={() => {
              actions.signOut();
              nav({ to: "/" });
            }}
            className="pill-gold-outline"
          >
            Sign Out
          </button>
        </div>
        <OrnamentalDivider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Orders Section */}
          <Card icon={<Box className="w-4 h-4" />} title="My Orders">
            <div className="bg-[color:var(--panel)] rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-[color:var(--espresso)]">
                Order Tracking & History
              </p>
              <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                Will be available soon after connecting Shiprocket integration.
              </p>
            </div>
          </Card>

          {/* Wishlist Section */}
          <Card icon={<Heart className="w-4 h-4" />} title="Wishlist">
            {wishlist.length === 0 ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No saved items yet.
              </p>
            ) : previewItems.length === 0 ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Loading saved items...
              </p>
            ) : (
              <ul className="space-y-2">
                {previewItems.map((p) => (
                  <li key={p.id} className="text-sm">
                    {p.name} —{" "}
                    <span className="text-[color:var(--gold-dark)] font-semibold">
                      {formatINR(p.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/wishlist"
              className="text-xs text-[color:var(--gold-dark)] font-semibold mt-3 inline-block hover:underline"
            >
              View all →
            </Link>
          </Card>

          {/* Saved Addresses Section */}
          <Card icon={<MapPin className="w-4 h-4" />} title="Saved Addresses">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              No saved addresses found. Add an address during checkout.
            </p>
          </Card>

          {/* Coupons Section */}
          <Card icon={<Tag className="w-4 h-4" />} title="Coupons & Offers">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              No active promotional coupons available for your account right now.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[color:var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-[color:var(--panel)] grid place-items-center text-[color:var(--gold-dark)]">
          {icon}
        </span>
        <h3 className="font-serif text-xl text-[color:var(--espresso)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}