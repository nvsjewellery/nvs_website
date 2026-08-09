import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";
import { ProductCard } from "@/components/ProductCard";

import { productsApi } from "@/lib/api";
import { useStore } from "@/lib/store";

/* =========================================================
   WISHLIST PRODUCT CACHE
========================================================= */

const wishlistProductCache: Record<
  string,
  any
> = {};

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute(
  "/wishlist"
)({
  component: Wishlist,
});

/* =========================================================
   WISHLIST
========================================================= */

function Wishlist() {
  const wishlist = useStore(
    (s) => s.wishlist
  );

  const [items, setItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const wishlistKey =
    wishlist.join(",");

  /* =======================================================
     LOAD WISHLIST PRODUCTS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadWishlistProducts() {
      if (
        !wishlist ||
        wishlist.length === 0
      ) {
        setItems([]);
        setLoading(false);
        return;
      }

      /*
       * Already cached products.
       */

      const cachedProducts =
        wishlist
          .map(
            (id) =>
              wishlistProductCache[
                id
              ]
          )
          .filter(Boolean);

      /*
       * If everything is cached,
       * render immediately.
       */

      if (
        cachedProducts.length ===
        wishlist.length
      ) {
        setItems(
          cachedProducts
        );

        setLoading(false);

        return;
      }

      /*
       * Only request missing products.
       */

      const missingIds =
        wishlist.filter(
          (id) =>
            !wishlistProductCache[
              id
            ]
        );

      /*
       * Show cached products
       * immediately if available.
       */

      if (
        cachedProducts.length > 0
      ) {
        setItems(
          cachedProducts
        );

        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const results =
          await Promise.all(
            missingIds.map(
              (id) =>
                productsApi
                  .getById(id)
                  .catch(
                    () => null
                  )
            )
          );

        results.forEach(
          (product) => {
            if (
              product &&
              product.id
            ) {
              wishlistProductCache[
                product.id
              ] = product;
            }
          }
        );

        if (isMounted) {
          const finalProducts =
            wishlist
              .map(
                (id) =>
                  wishlistProductCache[
                    id
                  ]
              )
              .filter(Boolean);

          setItems(
            finalProducts
          );
        }
      } catch (err) {
        console.error(
          "Failed to load wishlist items:",
          err
        );

        if (
          isMounted &&
          cachedProducts.length ===
            0
        ) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWishlistProducts();

    return () => {
      isMounted = false;
    };
  }, [wishlistKey]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ==================== HEADER ==================== */}

        <h1 className="font-serif text-4xl md:text-5xl text-[color:var(--espresso)]">
          Your Wishlist
        </h1>

        <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
          {wishlist.length} saved{" "}
          {wishlist.length === 1
            ? "item"
            : "items"}
        </p>

        <OrnamentalDivider className="mt-6 mb-8" />

        {/* ==================== LOADING ==================== */}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlist.map(
              (id: string) => (
                <div
                  key={id}
                  className="aspect-square bg-[color:var(--panel)] rounded-2xl animate-pulse border border-[color:var(--border)]"
                />
              )
            )}
          </div>
        ) : items.length === 0 ? (
          /* ==================== EMPTY WISHLIST ==================== */

          <div className="text-center py-20">
            <p className="text-[color:var(--muted-foreground)] max-w-md mx-auto">
              Your wishlist is empty. Tap the heart on any product to save it
              here.
            </p>

            <Link
              to="/gold"
              className="pill-gold mt-6 inline-flex cursor-pointer"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          /* ==================== WISHLIST PRODUCTS ==================== */

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map(
              (p: any) => (
                <ProductCard
                  key={p.id}
                  p={p}
                />
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}