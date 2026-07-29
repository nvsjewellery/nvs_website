import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Box, Heart, MapPin, Plus, Tag, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { actions, computeBreakdown, formatINR, useStore } from "@/lib/store";
import { productsApi } from "@/lib/api";

export const Route = createFileRoute("/account")({ component: Account });

type WishlistPreviewItem = { id: string; name: string; price: number };

type Address = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
};

export function Account() {
  const user = useStore((s) => s.user);
  const authChecked = useStore((s) => s.authChecked);
  const wishlist = useStore((s) => s.wishlist);
  const nav = useNavigate();

  const [previewItems, setPreviewItems] = useState<WishlistPreviewItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Address form fields
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

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

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine || !city || !pincode) return;

    const newAddr: Address = {
      id: Date.now().toString(),
      label,
      addressLine,
      city,
      pincode,
    };

    setAddresses([...addresses, newAddr]);
    setAddressLine("");
    setCity("");
    setPincode("");
    setShowAddForm(false);
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  // Wait for initial check before assuming user is signed out
  if (!user && !authChecked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading your account...</p>
        </div>
      </Layout>
    );
  }

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
            {addresses.length === 0 && !showAddForm ? (
              <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                No saved addresses found.
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-[color:var(--panel)] rounded-xl border border-[color:var(--border)] flex justify-between items-start"
                  >
                    <div>
                      <span className="label-caps text-[10px] text-[color:var(--gold-dark)] font-bold">
                        {a.label}
                      </span>
                      <p className="text-xs text-[color:var(--espresso)] font-medium mt-0.5">
                        {a.addressLine}, {a.city} — {a.pincode}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAddress(a.id)}
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddForm ? (
              <form
                onSubmit={handleAddAddress}
                className="space-y-3 pt-2 border-t border-[color:var(--border)]"
              >
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setLabel(lbl)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        label === lbl
                          ? "bg-[color:var(--gold)] text-white border-[color:var(--gold)]"
                          : "border-[color:var(--border)] text-[color:var(--espresso)]"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Street / House No. / Area"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[color:var(--border)] bg-white"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="pill-gold !py-1.5 !px-3 text-xs"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-[color:var(--muted-foreground)] px-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-semibold text-[color:var(--gold-dark)] inline-flex items-center gap-1 hover:underline mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            )}
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