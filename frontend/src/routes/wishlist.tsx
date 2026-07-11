import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ProductCard } from "@/components/ProductCard";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({ component: Wishlist });

function Wishlist() {
  const wishlist = useStore((s) => s.wishlist);
  const items = wishlist.map(getProduct).filter(Boolean) as ReturnType<typeof getProduct>[];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">Your Wishlist</h1>
        <p className="text-[color:var(--gold-dark)] mt-2 text-sm label-caps">{items.length} saved items</p>
        <OrnamentalDivider />
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[color:var(--muted-foreground)] max-w-md mx-auto">Your wishlist is empty. Tap the heart on any product to save it here.</p>
            <Link to="/gold" className="pill-gold mt-6 inline-flex">Browse Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((p) => p && <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
