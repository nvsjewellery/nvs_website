import { Link } from "@tanstack/react-router";
import { Heart, Tag } from "lucide-react";
import { useEffect, useState } from "react";

import {
  actions,
  formatINR,
  useStore,
  type Product,
} from "@/lib/store";

import {
  discountsApi,
  type Discount,
} from "@/lib/api";

/* =========================================================
   PRODUCT CARD
========================================================= */

export function ProductCard({
  p,
}: {
  p: Product;
}) {
  const wishlist = useStore(
    (s) => s.wishlist
  );

  const saved = wishlist.includes(
    p.id
  );

  const [discount, setDiscount] =
    useState<Discount | null>(null);

  const [discountLoading, setDiscountLoading] =
    useState(true);

  /* =======================================================
     LOAD AVAILABLE SEASONAL DISCOUNT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadDiscount() {
      setDiscountLoading(true);

      try {
        /*
         * Get discounts available to the
         * currently logged-in customer.
         *
         * Backend already filters:
         * - active discounts
         * - valid dates
         * - seasonal discounts
         * - customer-specific discounts
         *
         * We only display SEASONAL discounts
         * on product cards.
         */
        const discounts =
          await discountsApi.getAvailable();

        if (cancelled) {
          return;
        }

        /*
         * Find all seasonal discounts that
         * actually apply to this product.
         */
        const applicable =
          discounts.filter((item) => {
            /*
             * ------------------------------------------------
             * ONLY SEASONAL DISCOUNTS
             * ------------------------------------------------
             *
             * CUSTOMER discounts are handled later
             * at cart level.
             *
             * COUPON discounts require the customer
             * to manually enter a coupon code.
             */
            if (
              item.type !== "SEASONAL"
            ) {
              return false;
            }

            /*
             * ------------------------------------------------
             * METAL RESTRICTION
             * ------------------------------------------------
             *
             * If discount has a metal:
             *
             * Gold -> only Gold products
             * Silver -> only Silver products
             *
             * If metal is null:
             * applies to both.
             */
            if (
              item.metal &&
              item.metal !== p.metal
            ) {
              return false;
            }

            /*
             * ------------------------------------------------
             * PRODUCT-SPECIFIC DISCOUNT
             * ------------------------------------------------
             *
             * Example:
             *
             * Discount:
             *   target = PRODUCT
             *
             * Backend:
             *
             * products: [
             *   { id: "abc123" }
             * ]
             *
             * Only product abc123 gets it.
             */
            if (
              item.target === "PRODUCT"
            ) {
              return (
                item.products?.some(
                  (discountProduct) =>
                    discountProduct.id ===
                    p.id
                ) ?? false
              );
            }

            /*
             * ------------------------------------------------
             * CATEGORY-WIDE DISCOUNT
             * ------------------------------------------------
             *
             * Example:
             *
             * target   = CATEGORY
             * category = Earrings
             *
             * Every Earrings product receives
             * the discount.
             */
            if (
              item.target === "CATEGORY"
            ) {
              const productCategory =
                String(
                  p.category ??
                    p.sub ??
                    ""
                )
                  .trim()
                  .toLowerCase();

              const discountCategory =
                String(
                  item.category ??
                    ""
                )
                  .trim()
                  .toLowerCase();

              /*
               * No category information means
               * this discount cannot be matched.
               */
              if (
                !productCategory ||
                !discountCategory
              ) {
                return false;
              }

              return (
                productCategory ===
                discountCategory
              );
            }

            /*
             * CART discounts are not displayed
             * on individual product cards.
             */
            if (
              item.target === "CART"
            ) {
              return false;
            }

            /*
             * CUSTOMER discounts are not displayed
             * on product cards.
             */
            if (
              item.target === "CUSTOMER"
            ) {
              return false;
            }

            return false;
          });

        /*
         * No applicable seasonal discount.
         */
        if (
          applicable.length === 0
        ) {
          if (!cancelled) {
            setDiscount(null);
          }

          return;
        }

        /*
         * ------------------------------------------------
         * SELECT STRONGEST DISCOUNT
         * ------------------------------------------------
         *
         * For now:
         *
         * percent -> compare percentage
         * flat    -> compare flat amount
         *
         * The actual VA calculation will happen
         * later in the cart/order pricing flow.
         *
         * This selection is only for the display
         * badge.
         */
        const best =
          applicable.reduce(
            (
              current,
              next
            ) => {
              if (!current) {
                return next;
              }

              /*
               * Same discount kind:
               * choose the larger value.
               */
              if (
                current.kind ===
                  next.kind
              ) {
                return next.value >
                  current.value
                  ? next
                  : current;
              }

              /*
               * If one is percentage and
               * one is flat, keep the newer
               * one for display.
               *
               * Actual discount priority/
               * calculation is handled by
               * the backend pricing service.
               */
              return next;
            },
            null as Discount | null
          );

        if (!cancelled) {
          setDiscount(best);
        }
      } catch (error) {
        /*
         * Discount loading must NEVER
         * break the product card.
         */
        console.error(
          "Failed to load product discount:",
          error
        );

        if (!cancelled) {
          setDiscount(null);
        }
      } finally {
        if (!cancelled) {
          setDiscountLoading(false);
        }
      }
    }

    loadDiscount();

    return () => {
      cancelled = true;
    };
  }, [
    p.id,
    p.metal,
    p.category,
    p.sub,
  ]);

  /* =======================================================
     DISCOUNT LABEL
  ======================================================= */

  const discountLabel =
    discount &&
    !discountLoading
      ? discount.kind ===
        "percent"
        ? `${discount.value}% OFF`
        : `₹${discount.value} OFF`
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Link
      to="/product/$id"
      params={{
        id: p.id,
      }}
      className="block group"
    >
      {/* =================================================
          PRODUCT IMAGE
      ================================================= */}

      <div className="relative aspect-square bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--border)]">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-[color:var(--muted-foreground)]">
            No image
          </div>
        )}

        {/* =================================================
            SEASONAL DISCOUNT BADGE
        ================================================= */}

        {discountLabel && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)] text-white px-3 py-1.5 text-xs font-semibold shadow-sm">
              <Tag className="w-3 h-3" />

              {discountLabel}
            </span>
          </div>
        )}

        {/* =================================================
            WISHLIST BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            actions.toggleWishlist(
              p.id
            );
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

      {/* =================================================
          PRODUCT DETAILS
      ================================================= */}

      <div className="p-4">
        {/* =================================================
            SUB CATEGORY + METAL
        ================================================= */}

        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs text-[color:var(--muted-foreground)]">
            {p.sub}
          </p>

          <span className="text-xs text-[color:var(--gold-dark)]">
            {p.metal}
          </span>
        </div>

        {/* =================================================
            PRODUCT NAME
        ================================================= */}

        <Link
          to="/product/$id"
          params={{
            id: p.id,
          }}
          className="block cursor-pointer"
        >
          <h3 className="font-medium text-[color:var(--espresso)] hover:text-[color:var(--gold-dark)] transition-colors">
            {p.name}
          </h3>
        </Link>

        {/* =================================================
            PRICE
        ================================================= */}

        <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
          {p.purity} · {p.weight}g ·{" "}
          {formatINR(p.price)}
        </p>

        {/* =================================================
            DISCOUNT INFORMATION
        ================================================= */}

        {discount && (
          <p className="text-xs text-green-700 font-medium mt-2">
            {discount.kind ===
            "percent"
              ? `${discount.value}% off making charges`
              : `₹${discount.value} off making charges`}
          </p>
        )}

        {/* =================================================
            SHOP BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            actions.addToCart(
              p.id
            );
          }}
          className="pill-gold text-xs shrink-0 !py-1.5 !px-3 cursor-pointer mt-3"
        >
          Shop
        </button>
      </div>
    </Link>
  );
}

/* =========================================================
   SIMPLE PRODUCT CARD
========================================================= */

export function SimpleProductCard({
  p,
}: {
  p: Product;
}) {
  return (
    <Link
      to="/product/$id"
      params={{
        id: p.id,
      }}
      className="block group cursor-pointer"
    >
      {/* =================================================
          PRODUCT IMAGE
      ================================================= */}

      <div className="relative aspect-square bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--border)]">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-sm text-[color:var(--muted-foreground)]">
            No image
          </div>
        )}
      </div>

      {/* =================================================
          PRODUCT DETAILS
      ================================================= */}

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