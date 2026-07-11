import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { actions, formatINR, useStore, type Product } from "@/lib/store";

export function ProductCard({ p }: { p: Product }) {
  const wishlist = useStore((s) => s.wishlist);
  const saved = wishlist.includes(p.id);
  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[color:var(--border)] hover:shadow-lg hover:border-[color:var(--gold)]/50 transition">
      <div className="relative aspect-square overflow-hidden bg-[color:var(--panel)]">
        <Link to="/product/$id" params={{ id: p.id }}>
          <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        </Link>
        <span className="absolute top-3 left-3 bg-white/90 text-[10px] label-caps px-2.5 py-1 rounded-full text-[color:var(--espresso)]">
          {p.sub}
        </span>
        <button
          onClick={() => actions.toggleWishlist(p.id)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 grid place-items-center hover:scale-110 transition"
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-[color:var(--espresso)]"}`} />
        </button>
        <span className="absolute bottom-3 left-3 bg-[color:var(--gold)] text-white text-[10px] label-caps px-2.5 py-1 rounded-full">
          {p.metal}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to="/product/$id" params={{ id: p.id }} className="block">
              <h3 className="font-serif font-bold text-[color:var(--espresso)] leading-snug line-clamp-1">{p.name}</h3>
            </Link>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
              {p.purity} · {p.weight}g · {formatINR(p.price)}
            </p>
          </div>
          <button
            onClick={() => actions.addToCart(p.id)}
            className="pill-gold text-xs shrink-0 !py-1.5 !px-3"
          >
            Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export function SimpleProductCard({ p }: { p: Product }) {
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="block group">
      <div className="aspect-square rounded-xl overflow-hidden bg-[color:var(--panel)] border border-[color:var(--border)]">
        <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
      </div>
      <h4 className="font-serif font-semibold text-[color:var(--espresso)] mt-3 line-clamp-1">{p.name}</h4>
      <p className="text-xs label-caps text-[color:var(--gold-dark)] mt-1">{p.sub} · {p.purity}</p>
    </Link>
  );
}
