import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/nvs-logo.png";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/gold", label: "Gold" },
  { to: "/silver", label: "Silver" },
  { to: "/liverates", label: "Live Rates" },
  { to: "/contact", label: "Contact Us" },
];

export function Header() {
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);

  const pathname = useRouterState({
    select: (r) => r.location.pathname,
  });

  // Hydration state to avoid SSR/Client mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute counts safely
  const cartCount = mounted
    ? cart.reduce((n, c) => n + c.qty, 0)
    : 0;

  // Deduplicate wishlist IDs
  const wishlistCount = mounted
    ? Array.from(new Set(wishlist)).length
    : 0;

  return (
    <div
      style={{ backgroundColor: "var(--cream)" }}
      className="border-b border-[color:var(--gold)]/20"
    >
      {/* ==================== TOP HEADER ==================== */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-[86px] flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer"
            aria-label="NVS Jewellery Home"
          >
            <img
              src={logo}
              alt="NVS Jewellery"
              className="h-14 w-auto object-contain"
            />

            <div className="hidden sm:block">
              <p className="font-serif text-xl font-semibold text-[color:var(--espresso)]">
                NVS Jewellery
              </p>

              <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold-dark)]">
                Timeless. Trusted. Ours.
              </p>
            </div>
          </Link>

          {/* Center Brand */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
            aria-label="NVS Jewellery Home"
          >
            <span className="font-serif text-3xl text-[color:var(--gold-dark)]">
              NVS Jewellery
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-5">

            {/* Account */}
            <Link
              to="/account"
              className="relative cursor-pointer"
              aria-label="Account"
            >
              <User className="w-5 h-5 text-[color:var(--espresso)]" />
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-[color:var(--espresso)]" />

              {wishlistCount > 0 && (
                <span className="absolute -top-3 -right-3 min-w-5 h-5 px-1 rounded-full bg-[color:var(--gold)] text-white text-[10px] font-bold grid place-items-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative cursor-pointer"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 text-[color:var(--espresso)]" />

              {cartCount > 0 && (
                <span className="absolute -top-3 -right-3 min-w-5 h-5 px-1 rounded-full bg-[color:var(--gold)] text-white text-[10px] font-bold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== NAVIGATION ==================== */}
      <div
        style={{ backgroundColor: "var(--cream-dark)" }}
        className="border-b border-[color:var(--gold)]/20"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-[68px] flex items-center justify-center gap-3">

            {NAV.map((n) => {
              const active =
                n.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(n.to);

              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                    active
                      ? "border border-[color:var(--gold)] text-[color:var(--gold-dark)] bg-white/40"
                      : "text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
}