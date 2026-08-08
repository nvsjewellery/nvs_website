import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatINR, useStore, type Product } from "@/lib/store";

export function ProductCard({ p }: { p: Product }) {
  const wishlist = useStore((s) => s.wishlist);
  const saved = wishlist.includes(p.id);

  return (
    <div className="block group">
      {/* ==================== PRODUCT IMAGE ==================== */}
      <div className="relative">
        <Link
          to="/product/$id"
          params={{ id: p.id }}
          className="block cursor-pointer"
          aria-label={`View ${p.name}`}
        >
          <div className="aspect-square overflow-hidden rounded-2xl bg-[color:var(--panel)]">
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </Link>

        {/* ==================== WISHLIST BUTTON ==================== */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Import actions separately if needed.
            // This will be added below.
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 grid place-items-center cursor-pointer hover:scale-110 transition-transform duration-200"
          aria-label={
            saved
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            className={`w-4 h-4 ${
              saved
                ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                : "text-[color:var(--espresso)]"
            }`}
          />
        </button>
      </div>

      {/* ==================== PRODUCT DETAILS ==================== */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs text-[color:var(--muted-foreground)]">
            {p.sub}
          </p>

          <span className="text-xs text-[color:var(--gold-dark)]">
            {p.metal}
          </span>
        </div>

        {/* Product Name */}
        <Link
          to="/product/$id"
          params={{ id: p.id }}
          className="block cursor-pointer"
        >
          <h3 className="font-medium text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)] transition-colors">
            {p.name}
          </h3>
        </Link>

        {/* Product Info */}
        <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
          {p.purity} · {p.weight}g · {formatINR(p.price)}
        </p>

        {/* ==================== SHOP BUTTON ==================== */}
        <Link
          to="/product/$id"
          params={{ id: p.id }}
          className="pill-gold text-xs shrink-0 !py-1.5 !px-3 cursor-pointer mt-3 inline-flex"
        >
          Shop
        </Link>
      </div>
    </div>
  );
}

export function SimpleProductCard({
  p,
}: {
  p: Product;
}) {
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="block group cursor-pointer"
    >
      {/* Product Image */}
      <div className="aspect-square overflow-hidden rounded-2xl bg-[color:var(--panel)]">
        <img
          src={p.image}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="font-medium text-[color:var(--espresso)] group-hover:text-[color:var(--gold-dark)] transition-colors">
          {p.name}
        </h3>

        <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
          {p.sub} · {p.purity}
        </p>
      </div>
    </Link>
  );
}