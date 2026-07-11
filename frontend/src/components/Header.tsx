import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingBag, User, Search } from "lucide-react";
import logo from "@/assets/nvs-logo.png";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/gold", label: "Gold" },
  { to: "/silver", label: "Silver" },
  { to: "/platinum", label: "Platinum" },
  { to: "/diamond", label: "Diamond" },
  { to: "/contact", label: "Contact Us" },
];

export function Header() {
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const cartCount = cart.reduce((n, c) => n + c.qty, 0);

  return (
    <header className="sticky top-0 z-50">
      {/* Row 1 */}
      <div style={{ backgroundColor: "var(--cream)" }} className="border-b border-[color:var(--gold)]/20">
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full border-2 border-[color:var(--gold)] grid place-items-center bg-white shrink-0 overflow-hidden">
              <img src={logo} alt="NVS" className="w-9 h-9 object-contain" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="font-serif font-bold text-[color:var(--espresso)] leading-none">NVS Jewellery</div>
              <div className="label-caps text-[10px] text-[color:var(--gold-dark)] mt-1">Timeless. Trusted. Ours.</div>
            </div>
          </Link>
          <Link to="/" className="hidden md:block font-serif text-3xl lg:text-4xl text-[color:var(--gold)] tracking-tight">
            NVS Jewellery
          </Link>
          <div className="flex items-center justify-end gap-2">
            <Link to="/account" className="p-2 rounded-full hover:bg-white/60 transition" aria-label="Account">
              <User className="w-5 h-5 text-[color:var(--espresso)]" />
            </Link>
            <Link to="/wishlist" className="relative p-2 rounded-full hover:bg-white/60 transition" aria-label="Wishlist">
              <Heart className="w-5 h-5 text-[color:var(--espresso)]" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-[color:var(--gold)] text-white rounded-full w-4 h-4 grid place-items-center font-bold">{wishlist.length}</span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-white/60 transition" aria-label="Cart">
              <ShoppingBag className="w-5 h-5 text-[color:var(--espresso)]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-[color:var(--gold)] text-white rounded-full w-4 h-4 grid place-items-center font-bold">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
      {/* Row 2 */}
      <div style={{ backgroundColor: "var(--cream-dark)" }} className="border-b border-[color:var(--gold)]/20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 flex-1 max-w-md shadow-sm">
            <Search className="w-4 h-4 text-[color:var(--muted-foreground)]" />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search for gold, silver, diamond jewellery..."
            />
          </div>
          <nav className="flex items-center gap-1 flex-wrap justify-end">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    active
                      ? "border border-[color:var(--gold)] text-[color:var(--gold-dark)] bg-white/40"
                      : "text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
